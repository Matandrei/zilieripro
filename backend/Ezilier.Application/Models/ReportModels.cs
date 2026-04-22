using Ezilier.Domain.Enums;

namespace Ezilier.Application.Models;

public record Ipc21ReportRequest
{
    public string Period { get; init; } = string.Empty;
    public Guid BeneficiaryId { get; init; }
}

public record Ipc21ReportModel
{
    public string Period { get; init; } = string.Empty;
    public BeneficiaryModel Beneficiary { get; init; } = null!;
    public int TotalVouchers { get; init; }
    public decimal TotalNetRemuneration { get; init; }
    public decimal TotalIncomeTax { get; init; }
    public decimal TotalCnasContribution { get; init; }
    public decimal TotalGrossRemuneration { get; init; }
    public List<Ipc21LineItem> Lines { get; init; } = [];
}

public record Ipc21LineItem
{
    public string WorkerIdnp { get; init; } = string.Empty;
    public string WorkerFullName { get; init; } = string.Empty;
    public int VoucherCount { get; init; }
    public int TotalHours { get; init; }
    public decimal NetRemuneration { get; init; }
    public decimal IncomeTax { get; init; }
    public decimal CnasContribution { get; init; }
    public decimal GrossRemuneration { get; init; }
}

public record StatisticsQueryParams
{
    public string? District { get; init; }
    public string? Period { get; init; }
    public DateOnly? DateFrom { get; init; }
    public DateOnly? DateTo { get; init; }
    public Guid? BeneficiaryId { get; init; }
}

public record StatisticsModel
{
    public int TotalVouchers { get; init; }
    public int TotalWorkers { get; init; }
    public int TotalBeneficiaries { get; init; }
    public decimal TotalNetRemuneration { get; init; }
    public decimal TotalGrossRemuneration { get; init; }
    public decimal TotalTaxCollected { get; init; }
    public Dictionary<string, int> VouchersByStatus { get; init; } = [];
    public Dictionary<string, int> VouchersByDistrict { get; init; } = [];
    public Dictionary<string, decimal> RemunerationByMonth { get; init; } = [];
}

public record DailyRegisterModel
{
    public DateOnly Date { get; init; }
    public BeneficiaryModel Beneficiary { get; init; } = null!;
    public string WorkDistrict { get; init; } = string.Empty;
    public string WorkLocality { get; init; } = string.Empty;
    public string? WorkAddress { get; init; }
    public List<DailyRegisterLine> Lines { get; init; } = [];
}

public record DailyRegisterLine
{
    public int Nr { get; init; }
    public string VoucherCode { get; init; } = string.Empty;
    public string WorkerIdnp { get; init; } = string.Empty;
    public string WorkerFullName { get; init; } = string.Empty;
    public int HoursWorked { get; init; }
    public decimal NetRemuneration { get; init; }
    public VoucherStatus Status { get; init; }
}

public record PaginatedResult<T>
{
    public List<T> Items { get; init; } = [];
    public int TotalCount { get; init; }
    public int Offset { get; init; }
    public int Limit { get; init; }
}
