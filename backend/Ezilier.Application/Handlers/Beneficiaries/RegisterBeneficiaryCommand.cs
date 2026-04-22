using Ezilier.Application.Interfaces;
using Ezilier.Application.Models;
using Ezilier.Domain.Entities;
using FluentValidation.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ezilier.Application.Handlers.Beneficiaries;

public record RegisterBeneficiaryCommand(
    RegisterBeneficiaryRequest Request
) : IRequest<(BeneficiaryModel? Model, ValidationResult? ValidationResult, int StatusCode)>;

public class RegisterBeneficiaryCommandHandler(
    IDataContext context,
    IRsudService rsudService
) : IRequestHandler<RegisterBeneficiaryCommand, (BeneficiaryModel? Model, ValidationResult? ValidationResult, int StatusCode)>
{
    public async Task<(BeneficiaryModel? Model, ValidationResult? ValidationResult, int StatusCode)> Handle(
        RegisterBeneficiaryCommand command, CancellationToken cancellationToken)
    {
        var idno = command.Request.Idno?.Trim();

        if (string.IsNullOrWhiteSpace(idno))
        {
            return (null, new ValidationResult(
                [new ValidationFailure("Idno", "IDNO este obligatoriu.")]), 400);
        }

        // Check if beneficiary already exists
        var existing = await context.Beneficiaries
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.Idno == idno && !b.IsDeleted, cancellationToken);

        if (existing is not null)
        {
            return (null, new ValidationResult(
                [new ValidationFailure("Idno", "Un beneficiar cu acest IDNO este deja inregistrat.")]), 409);
        }

        // Fetch company data from RSUD
        var rsudData = await rsudService.GetCompanyByIdnoAsync(idno);

        if (rsudData is null)
        {
            return (null, new ValidationResult(
                [new ValidationFailure("Idno", "Compania nu a fost gasita in registrul RSUD.")]), 404);
        }

        var beneficiary = new Beneficiary
        {
            Idno = idno,
            CompanyName = rsudData.CompanyName,
            LegalForm = rsudData.LegalForm,
            ActivityType = rsudData.ActivityType,
            Address = rsudData.Address,
            District = rsudData.District,
            Locality = rsudData.Locality,
            Phone = rsudData.Phone,
            Email = rsudData.Email
        };

        context.Beneficiaries.Add(beneficiary);
        await context.SaveChangesAsync(cancellationToken);

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
            WorkerCount = 0,
            VoucherCount = 0,
            CreatedAt = beneficiary.CreatedAt
        };

        return (model, null, 201);
    }
}
