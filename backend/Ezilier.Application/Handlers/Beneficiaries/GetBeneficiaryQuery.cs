using Ezilier.Application.Interfaces;
using Ezilier.Application.Models;
using FluentValidation.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ezilier.Application.Handlers.Beneficiaries;

public record GetBeneficiaryQuery(
    Guid Id
) : IRequest<(BeneficiaryModel? Model, ValidationResult? ValidationResult, int StatusCode)>;

public class GetBeneficiaryQueryHandler(
    IDataContext context
) : IRequestHandler<GetBeneficiaryQuery, (BeneficiaryModel? Model, ValidationResult? ValidationResult, int StatusCode)>
{
    public async Task<(BeneficiaryModel? Model, ValidationResult? ValidationResult, int StatusCode)> Handle(
        GetBeneficiaryQuery query, CancellationToken cancellationToken)
    {
        var beneficiary = await context.Beneficiaries
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.Id == query.Id && !b.IsDeleted, cancellationToken);

        if (beneficiary is null)
        {
            return (null, new ValidationResult(
                [new ValidationFailure("Id", "Beneficiarul nu a fost gasit.")]), 404);
        }

        var workerCount = await context.Workers
            .CountAsync(w => w.BeneficiaryId == query.Id && !w.IsDeleted, cancellationToken);

        var voucherCount = await context.Vouchers
            .CountAsync(v => v.BeneficiaryId == query.Id && !v.IsDeleted, cancellationToken);

        var model = new BeneficiaryModel
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
            WorkerCount = workerCount,
            VoucherCount = voucherCount,
            CreatedAt = beneficiary.CreatedAt
        };

        return (model, null, 200);
    }
}
