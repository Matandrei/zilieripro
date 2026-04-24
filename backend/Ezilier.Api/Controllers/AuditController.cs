using Ezilier.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Ezilier.Api.Controllers;

[Authorize]
public class AuditController : BaseApiController
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromServices] IDataContext db,
        [FromQuery] int offset = 0,
        [FromQuery] int limit = 100,
        [FromQuery] string? search = null)
    {
        // Only Administrator can read the audit trail
        if (!string.Equals(CurrentRole, "administrator", StringComparison.OrdinalIgnoreCase))
        {
            return Forbid();
        }

        var query = db.AuditLogs.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLowerInvariant();
            query = query.Where(a =>
                a.Action.ToLower().Contains(s) ||
                (a.UserName ?? string.Empty).ToLower().Contains(s) ||
                (a.Details ?? string.Empty).ToLower().Contains(s));
        }

        var total = await query.CountAsync();

        // SQLite cannot ORDER BY DateTimeOffset — sort by Id (UUID v4, random but stable).
        var items = await query
            .OrderByDescending(a => a.Id)
            .Skip(offset)
            .Take(Math.Min(limit, 500))
            .Select(a => new
            {
                a.Id,
                a.Action,
                a.EntityType,
                a.EntityId,
                a.UserId,
                a.UserName,
                a.Details,
                a.IpAddress,
                a.CreatedAt,
            })
            .ToListAsync();

        return Ok(new { items, totalCount = total, offset, limit });
    }
}
