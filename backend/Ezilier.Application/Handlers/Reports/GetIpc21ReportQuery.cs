using Ezilier.Application.Interfaces;
using Ezilier.Application.Models;
using Ezilier.Domain.Enums;
using FluentValidation.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ezilier.Application.Handlers.Reports;

public record GetIpc21ReportQuery(
    Guid BeneficiaryId,
    string Period
) : IRequest<(Ipc21ReportModel? Model, ValidationResult? ValidationResult, int StatusCode)>;

public class GetIpc21ReportQueryHandler(
    IDataContext context
) : IRequestHandler<GetIpc21ReportQuery, (Ipc21ReportModel? Model, ValidationResult? ValidationResult, int StatusCode)>
{
    public async Task<(Ipc21ReportModel? Model, ValidationResult? ValidationResult, int StatusCode)> Handle(
        GetIpc21ReportQuery query, CancellationToken cancellationToken)
    {
        // Validate period format (e.g. "2026-03")
        if (!DateOnly.TryParseExact(query.Period + "-01", "yyyy-MM-dd", out var periodStart))
        {
            return (null, new ValidationResult(
                [new ValidationFailure("Period", "Formatul perioadei este invalid. Utilizati formatul yyyy-MM.")]), 400);
        }

        var periodEnd = periodStart.AddMonths(1).AddDays(-1);

        var beneficiary = await context.Beneficiaries
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.Id == query.BeneficiaryId && !b.IsDeleted, cancellationToken);

        if (beneficiary is null)
        {
            return (null, new ValidationResult(
                [new ValidationFailure("BeneficiaryId", "Beneficiarul nu a fost gasit.")]), 404);
        }

        // Get all reported vouchers for the period grouped by worker
        var vouchers = await context.Vouchers
            .AsNoTracking()
            .Include(v => v.Worker)
            .Where(v => v.BeneficiaryId == query.BeneficiaryId
                && v.WorkDate >= periodStart
                && v.WorkDate <= periodEnd
                && v.Status != VoucherStatus.Anulat)
            .ToListAsync(cancellationToken);

        var lines = vouchers
            .GroupBy(v => v.WorkerId)
            .Select(g =>
            {
                var worker = g.First().Worker;
                return new Ipc21LineItem
                {
                    WorkerIdnp = worker.Idnp,
                    WorkerFullName = $"{worker.FirstName} {worker.LastName}",
                    VoucherCount = g.Count(),
                    TotalHours = g.Sum(v => v.HoursWorked),
                    NetRemuneration = g.Sum(v => v.NetRemuneration),
                    IncomeTax = g.Sum(v => v.IncomeTax),
                    CnasContribution = g.Sum(v => v.CnasContribution),
                    GrossRemuneration = g.Sum(v => v.GrossRemuneration)
                };
            })
            .OrderBy(l => l.WorkerFullName)
            .ToList();

        var report = new Ipc21ReportModel
        {
            Period = query.Period,
            Beneficiary = new BeneficiaryModel
            {
                Id = beneficiary.Id,
                Idno = beneficiary.Idno,
                CompanyName = beneficiary.CompanyName,
                LegalForm = beneficiary.LegalForm,
                ActivityType = beneficiary.ActivityType,
                Address = beneficiary.Address,
                District = beneficiary.District,
                Locality = beneficiary.Locality,
                Phone = beneficiary.Phone,
                Email = beneficiary.Email,
                CreatedAt = beneficiary.CreatedAt
            },
            TotalVouchers = lines.Sum(l => l.VoucherCount),
            TotalNetRemuneration = lines.Sum(l => l.NetRemuneration),
            TotalIncomeTax = lines.Sum(l => l.IncomeTax),
            TotalCnasContribution = lines.Sum(l => l.CnasContribution),
            TotalGrossRemuneration = lines.Sum(l => l.GrossRemuneration),
            Lines = lines
        };

        return (report, null, 200);
    }
}
