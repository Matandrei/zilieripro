using System.Diagnostics;
using System.Security.Claims;
using Ezilier.Application.Interfaces;
using Ezilier.Domain.Entities;

namespace Ezilier.Api.Middleware;

// Captures each authenticated API call and persists a compact audit record.
// Skips anonymous endpoints, OPTIONS pre-flights and static files.
public class AuditLoggingMiddleware
{
    private readonly RequestDelegate _next;

    public AuditLoggingMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, IDataContext db)
    {
        var sw = Stopwatch.StartNew();
        var path = context.Request.Path.Value ?? string.Empty;
        var method = context.Request.Method;

        Exception? exception = null;
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            exception = ex;
            throw;
        }
        finally
        {
            sw.Stop();

            var shouldLog =
                path.StartsWith("/api/", StringComparison.OrdinalIgnoreCase) &&
                !method.Equals("OPTIONS", StringComparison.OrdinalIgnoreCase) &&
                context.User?.Identity?.IsAuthenticated == true &&
                // skip pure GETs on noise endpoints
                !path.Contains("/accounts/me", StringComparison.OrdinalIgnoreCase);

            if (shouldLog)
            {
                try
                {
                    var idnp = context.User?.FindFirst("idnp")?.Value ?? string.Empty;
                    var role = context.User?.FindFirst(ClaimTypes.Role)?.Value ?? string.Empty;
                    Guid? userId = Guid.TryParse(context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var g) ? g : null;

                    var statusCode = exception != null ? 500 : context.Response.StatusCode;
                    var action = $"{method} {path}";
                    var details = string.IsNullOrEmpty(context.Request.QueryString.Value)
                        ? $"{statusCode} in {sw.ElapsedMilliseconds}ms"
                        : $"{statusCode} in {sw.ElapsedMilliseconds}ms query={context.Request.QueryString.Value}";

                    db.AuditLogs.Add(new AuditLog
                    {
                        Action = action,
                        EntityType = "Api",
                        UserId = userId,
                        UserName = idnp,
                        Details = details,
                        IpAddress = context.Connection.RemoteIpAddress?.ToString(),
                    });
                    await db.SaveChangesAsync();
                }
                catch
                {
                    // Never fail a request because of audit logging.
                }
            }
        }
    }
}
