using Ezilier.Application.Interfaces;
using Ezilier.Application.Models;
using Ezilier.Application.Services;
using Ezilier.Domain.Enums;
using FluentValidation.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ezilier.Application.Handlers.Auth;

public sealed class LoginCommand : IRequest<(LoginResponse? Model, ValidationResult? ValidationResult, int StatusCode)>
{
    public LoginRequest Request { get; set; } = null!;
}

public sealed class LoginCommandHandler
    : IRequestHandler<LoginCommand, (LoginResponse? Model, ValidationResult? ValidationResult, int StatusCode)>
{
    private readonly IDataContext _context;
    private readonly ITokenService _tokenService;

    public LoginCommandHandler(IDataContext context, ITokenService tokenService)
    {
        _context = context;
        _tokenService = tokenService;
    }

    public async Task<(LoginResponse? Model, ValidationResult? ValidationResult, int StatusCode)> Handle(
        LoginCommand command, CancellationToken ct)
    {
        var request = command.Request;

        // Find user by IDNP
        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Idnp == request.Idnp, ct);

        if (user is null)
        {
            return (null, new ValidationResult(new[]
            {
                new ValidationFailure("Credentials", "IDNP sau parola incorectă.")
            }), 401);
        }

        // Load identity with role, permissions, and beneficiary
        var identity = await _context.UserIdentities
            .Include(ui => ui.Role)
                .ThenInclude(r => r.Permissions)
            .Include(ui => ui.Permissions)
                .ThenInclude(up => up.Permission)
            .Include(ui => ui.Beneficiary)
            .FirstOrDefaultAsync(ui => ui.UserId == user.Id, ct);

        if (identity is null)
        {
            return (null, new ValidationResult(new[]
            {
                new ValidationFailure("Credentials", "IDNP sau parola incorectă.")
            }), 401);
        }

        // Check account status
        if (identity.Status != UserStatus.Active)
        {
            return (null, new ValidationResult(new[]
            {
                new ValidationFailure("Status", "Contul este blocat sau dezactivat.")
            }), 401);
        }

        // Verify password
        if (string.IsNullOrEmpty(identity.PasswordHash) ||
            !BCrypt.Net.BCrypt.Verify(request.Password, identity.PasswordHash))
        {
            return (null, new ValidationResult(new[]
            {
                new ValidationFailure("Credentials", "IDNP sau parola incorectă.")
            }), 401);
        }

        // Collect permissions: role-level + user-level overrides
        var permissions = identity.Role.Permissions
            .Select(p => p.Key)
            .Union(identity.Permissions.Select(up => up.Permission.Key))
            .Distinct()
            .ToList();

        // Generate tokens
        var accessToken = _tokenService.GenerateAccessToken(
            user.Id, user.Idnp, identity.Role.Key, permissions, identity.BeneficiaryId);

        var refreshToken = _tokenService.GenerateRefreshToken();

        // Persist refresh token
        identity.RefreshToken = refreshToken;
        identity.RefreshTokenExpiresAt = DateTimeOffset.UtcNow.AddDays(7);
        await _context.SaveChangesAsync(ct);

        var userInfo = new UserInfoModel(
            Id: user.Id,
            Idnp: user.Idnp,
            FirstName: user.FirstName,
            LastName: user.LastName,
            Email: user.Email,
            Role: identity.Role.Key,
            RoleType: identity.Role.Type.ToString(),
            BeneficiaryId: identity.BeneficiaryId,
            BeneficiaryName: identity.Beneficiary?.CompanyName,
            Permissions: permissions
        );

        var response = new LoginResponse(
            Token: accessToken,
            RefreshToken: refreshToken,
            ExpiresAt: DateTimeOffset.UtcNow.AddHours(1),
            User: userInfo
        );

        return (response, null, 200);
    }
}
