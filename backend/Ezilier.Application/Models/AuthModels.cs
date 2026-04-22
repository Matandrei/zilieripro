namespace Ezilier.Application.Models;

public record LoginRequest(string Idnp, string Password);

public record LoginResponse(
    string Token,
    string RefreshToken,
    DateTimeOffset ExpiresAt,
    UserInfoModel User
);

public record RefreshTokenRequest(string RefreshToken);

public record UserInfoModel(
    Guid Id,
    string Idnp,
    string FirstName,
    string LastName,
    string? Email,
    string Role,
    string RoleType,
    Guid? BeneficiaryId,
    string? BeneficiaryName,
    List<string> Permissions
);
