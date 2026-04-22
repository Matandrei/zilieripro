namespace Ezilier.Domain.Entities;

public class Beneficiary : EntityBase
{
    public string Idno { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string? LegalForm { get; set; }
    public string? ActivityType { get; set; }
    public string? Address { get; set; }
    public string? District { get; set; }
    public string? Locality { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }

    public virtual IList<Worker> Workers { get; set; } = [];
    public virtual IList<Voucher> Vouchers { get; set; } = [];
    public virtual IList<UserIdentity> Users { get; set; } = [];
}
