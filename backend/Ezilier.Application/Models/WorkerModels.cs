namespace Ezilier.Application.Models;

public record WorkerModel
{
    public Guid Id { get; init; }
    public string Idnp { get; init; } = string.Empty;
    public string FirstName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
    public DateOnly BirthDate { get; init; }
    public string? Phone { get; init; }
    public string? Email { get; init; }
    public bool RspValidated { get; init; }
    public DateTimeOffset? RspValidatedAt { get; init; }
    public string? RspErrorMessage { get; init; }
    public int VoucherCount { get; init; }
    public DateTimeOffset CreatedAt { get; init; }
}

public record CreateWorkerRequest
{
    public string Idnp { get; init; } = string.Empty;
    public string FirstName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
    public DateOnly BirthDate { get; init; }
    public string? Phone { get; init; }
    public string? Email { get; init; }
}

public record UpdateWorkerRequest
{
    public string? Phone { get; init; }
    public string? Email { get; init; }
}

public record RspVerificationResult
{
    public bool IsValid { get; init; }
    public string? ErrorMessage { get; init; }
    public Dictionary<string, string> FieldErrors { get; init; } = [];
}

public record WorkersQueryParams
{
    public int Offset { get; init; }
    public int Limit { get; init; } = 25;
    public string? Search { get; init; }
    public string? Idnp { get; init; }
    public Guid? BeneficiaryId { get; init; }
}
