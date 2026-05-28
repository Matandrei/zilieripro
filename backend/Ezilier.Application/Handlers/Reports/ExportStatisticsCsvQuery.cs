using System.Text;
using Ezilier.Application.Interfaces;
using Ezilier.Application.Models;
using FluentValidation.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ezilier.Application.Handlers.Reports;

public record ExportStatisticsCsvQuery(
    StatisticsQueryParams Params
) : IRequest<(byte[]? Csv, string FileName, ValidationResult? ValidationResult, int StatusCode)>;

public class ExportStatisticsCsvQueryHandler(
    IDataContext context
) : IRequestHandler<ExportStatisticsCsvQuery, (byte[]? Csv, string FileName, ValidationResult? ValidationResult, int StatusCode)>
{
    public async Task<(byte[]? Csv, string FileName, ValidationResult? ValidationResult, int StatusCode)> Handle(
        ExportStatisticsCsvQuery query, CancellationToken cancellationToken)
    {
        var p = query.Params;

        var vouchersQuery = context.Vouchers
            .AsNoTracking()
            .Include(v => v.Worker)
            .Where(v => !v.IsDeleted);

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

        var vouchers = await vouchersQuery
            .OrderBy(v => v.WorkDate)
            .ThenBy(v => v.Worker.LastName)
            .ToListAsync(cancellationToken);

        var sb = new StringBuilder();
        sb.AppendLine("Cod Voucher,IDNP Lucrător,Prenume Nume Lucrător,Data Muncii,Ore Lucrate,Remunerare Netă,Remunerare Brută,Impozit,Contribuție CNAS,Status,Raion,Localitate");

        foreach (var v in vouchers)
        {
            var fullName = $"{v.Worker.FirstName} {v.Worker.LastName}";
            sb.AppendLine(string.Join(",",
                EscapeCsv(v.Code),
                EscapeCsv(v.Worker.Idnp),
                EscapeCsv(fullName),
                v.WorkDate.ToString("yyyy-MM-dd"),
                v.HoursWorked.ToString(),
                v.NetRemuneration.ToString("F2"),
                v.GrossRemuneration.ToString("F2"),
                v.IncomeTax.ToString("F2"),
                v.CnasContribution.ToString("F2"),
                EscapeCsv(v.Status.ToString()),
                EscapeCsv(v.WorkDistrict),
                EscapeCsv(v.WorkLocality)
            ));
        }

        var bom = new byte[] { 0xEF, 0xBB, 0xBF };
        var content = Encoding.UTF8.GetBytes(sb.ToString());
        var csv = bom.Concat(content).ToArray();

        var fileName = $"statistici_{DateTime.UtcNow:yyyyMMdd_HHmmss}.csv";
        return (csv, fileName, null, 200);
    }

    private static string EscapeCsv(string value)
    {
        if (value.Contains(',') || value.Contains('"') || value.Contains('\n'))
            return $"\"{value.Replace("\"", "\"\"")}\"";
        return value;
    }
}
