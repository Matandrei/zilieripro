namespace Ezilier.Domain.Entities;

public class Worker : EntityBase
{
    public string Idnp { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public DateOnly BirthDate { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }

    public bool RspValidated { get; set; }
    public DateTimeOffset? RspValidatedAt { get; set; }
    public string? RspErrorMessage { get; set; }

    public Guid BeneficiaryId { get; set; }
    public virtual Beneficiary Beneficiary { get; set; } = null!;
    public virtual IList<Voucher> Vouchers { get; set; } = [];
}
