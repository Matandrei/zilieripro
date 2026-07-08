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
            .Include(v => v.Worker)
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

        if (!string.IsNullOrWhiteSpace(p.WorkerIdnp))
            vouchersQuery = vouchersQuery.Where(v => v.Worker.Idnp.Contains(p.WorkerIdnp));

        var vouchers = await vouchersQuery.ToListAsync(cancellationToken);

        var vouchersByStatus = vouchers
            .GroupBy(v => v.Status.ToString())
            .ToDictionary(g => g.Key, g => g.Count());

        var vouchersByDistrict = vouchers
            .GroupBy(v => v.WorkDistrict)
            .ToDictionary(g => g.Key, g => g.Count());

        // Distinct workers bucketed by age (as of today), demographic view over the filtered set.
        var today = DateOnly.FromDateTime(DateTimeOffset.UtcNow.UtcDateTime);
        var workersByAgeGroup = vouchers
            .Where(v => v.Worker is not null)
            .GroupBy(v => v.WorkerId)
            .Select(g => g.First().Worker)
            .GroupBy(w => AgeGroup(CalculateAge(w.BirthDate, today)))
            .ToDictionary(g => g.Key, g => g.Count());

        var vouchersByMonth = vouchers
            .GroupBy(v => v.WorkDate.ToString("yyyy-MM"))
            .ToDictionary(g => g.Key, g => g.Count());

        var hoursByMonth = vouchers
            .GroupBy(v => v.WorkDate.ToString("yyyy-MM"))
            .ToDictionary(g => g.Key, g => g.Sum(v => v.HoursWorked));

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
            TotalHoursWorked = vouchers.Sum(v => v.HoursWorked),
            TotalNetRemuneration = vouchers.Sum(v => v.NetRemuneration),
            TotalGrossRemuneration = vouchers.Sum(v => v.GrossRemuneration),
            TotalTaxCollected = vouchers.Sum(v => v.IncomeTax + v.CnasContribution),
            VouchersByStatus = vouchersByStatus,
            VouchersByDistrict = vouchersByDistrict,
            WorkersByAgeGroup = workersByAgeGroup,
            VouchersByMonth = vouchersByMonth,
            HoursByMonth = hoursByMonth,
            RemunerationByMonth = remunerationByMonth
        };

        return (model, null, 200);
    }

    private static int CalculateAge(DateOnly birthDate, DateOnly today)
    {
        var age = today.Year - birthDate.Year;
        if (birthDate > today.AddYears(-age)) age--;
        return age;
    }

    private static string AgeGroup(int age) => age switch
    {
        < 18 => "Sub 18",
        <= 24 => "18-24",
        <= 34 => "25-34",
        <= 44 => "35-44",
        <= 54 => "45-54",
        <= 64 => "55-64",
        _ => "65+"
    };
}
