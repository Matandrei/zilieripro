using Ezilier.Application.Interfaces;
using Ezilier.Application.Models;
using Ezilier.Domain.Enums;
using FluentValidation.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ezilier.Application.Handlers.Reports;

public record GetDailyRegisterQuery(
    Guid BeneficiaryId,
    DateOnly Date
) : IRequest<(DailyRegisterModel? Model, ValidationResult? ValidationResult, int StatusCode)>;

public class GetDailyRegisterQueryHandler(
    IDataContext context
) : IRequestHandler<GetDailyRegisterQuery, (DailyRegisterModel? Model, ValidationResult? ValidationResult, int StatusCode)>
{
    public async Task<(DailyRegisterModel? Model, ValidationResult? ValidationResult, int StatusCode)> Handle(
        GetDailyRegisterQuery query, CancellationToken cancellationToken)
    {
        var beneficiary = await context.Beneficiaries
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.Id == query.BeneficiaryId && !b.IsDeleted, cancellationToken);

        if (beneficiary is null)
        {
            return (null, new ValidationResult(
                [new ValidationFailure("BeneficiaryId", "Beneficiarul nu a fost gasit.")]), 404);
        }

        var vouchers = await context.Vouchers
            .AsNoTracking()
            .Include(v => v.Worker)
            .Where(v => v.BeneficiaryId == query.BeneficiaryId
                && v.WorkDate == query.Date
                && v.Status != VoucherStatus.Anulat)
            .OrderBy(v => v.Worker.LastName)
            .ThenBy(v => v.Worker.FirstName)
            .ToListAsync(cancellationToken);

        var lines = vouchers
            .Select((v, index) => new DailyRegisterLine
            {
                Nr = index + 1,
                VoucherCode = v.Code,
                WorkerIdnp = v.Worker.Idnp,
                WorkerFullName = $"{v.Worker.FirstName} {v.Worker.LastName}",
                HoursWorked = v.HoursWorked,
                NetRemuneration = v.NetRemuneration,
                Status = v.Status
            })
            .ToList();

        var firstVoucher = vouchers.FirstOrDefault();

        var model = new DailyRegisterModel
        {
            Date = query.Date,
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
            WorkDistrict = firstVoucher?.WorkDistrict ?? string.Empty,
            WorkLocality = firstVoucher?.WorkLocality ?? string.Empty,
            WorkAddress = firstVoucher?.WorkAddress,
            Lines = lines
        };

        return (model, null, 200);
    }
}
