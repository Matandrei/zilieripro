using Ezilier.Application.Interfaces;
using Ezilier.Application.Models;
using Ezilier.Domain.Enums;
using FluentValidation.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ezilier.Application.Handlers.Reports;

public record GetStatisticsQuery(
    StatisticsQueryParams Params
) : IRequest<(StatisticsModel? Model, ValidationResult? ValidationResult, int StatusCode)>;

public class GetStatisticsQueryHandler(
    IDataContext context
) : IRequestHandler<GetStatisticsQuery, (StatisticsModel? Model, ValidationResult? ValidationResult, int StatusCode)>
{
    public async Task<(StatisticsModel? Model, ValidationResult? ValidationResult, int StatusCode)> Handle(
        GetStatisticsQuery query, CancellationToken cancellationToken)
    {
        var p = query.Params;

        var vouchersQuery = context.Vouchers
            .AsNoTracking()
            .Where(v => !v.IsDeleted);

        // Apply filters
        if (p.BeneficiaryId.HasValue)
            vouchersQuery = vouchersQuery.Where(v => v.BeneficiaryId == p.BeneficiaryId.Value);

        if (!string.IsNullOrWhiteSpace(p.District))
            vouchersQuery = vouchersQuery.Where(v => v.WorkDistrict == p.District);

        if (!string.IsNullOrWhiteSpace(p.Period))
        {
            if (DateOnly.TryParseExact(p.Period + "-01", "yyyy-MM-dd", out var periodStart))
            {
                var periodEnd = periodStart.AddMonths(1).AddDays(-1);
                vouchersQuery = vouchersQuery.Where(v => v.WorkDate >= periodStart && v.WorkDate <= periodEnd);
            }
        }

        if (p.DateFrom.HasValue)
            vouchersQuery = vouchersQuery.Where(v => v.WorkDate >= p.DateFrom.Value);

        if (p.DateTo.HasValue)
            vouchersQuery = vouchersQuery.Where(v => v.WorkDate <= p.DateTo.Value);

        var vouchers = await vouchersQuery.ToListAsync(cancellationToken);

        var vouchersByStatus = vouchers
            .GroupBy(v => v.Status.ToString())
            .ToDictionary(g => g.Key, g => g.Count());

        var vouchersByDistrict = vouchers
            .GroupBy(v => v.WorkDistrict)
            .ToDictionary(g => g.Key, g => g.Count());

        var remunerationByMonth = vouchers
            .GroupBy(v => v.WorkDate.ToString("yyyy-MM"))
            .ToDictionary(g => g.Key, g => g.Sum(v => v.NetRemuneration));

        var totalWorkers = vouchers.Select(v => v.WorkerId).Distinct().Count();
        var totalBeneficiaries = vouchers.Select(v => v.BeneficiaryId).Distinct().Count();

        var model = new StatisticsModel
        {
            TotalVouchers = vouchers.Count,
            TotalWorkers = totalWorkers,
            TotalBeneficiaries = totalBeneficiaries,
            TotalNetRemuneration = vouchers.Sum(v => v.NetRemuneration),
            TotalGrossRemuneration = vouchers.Sum(v => v.GrossRemuneration),
            TotalTaxCollected = vouchers.Sum(v => v.IncomeTax + v.CnasContribution),
            VouchersByStatus = vouchersByStatus,
            VouchersByDistrict = vouchersByDistrict,
            RemunerationByMonth = remunerationByMonth
        };

        return (model, null, 200);
    }
}
