using Ezilier.Application.Interfaces;
using Ezilier.Application.Models;
using Ezilier.Domain.Entities;
using FluentValidation.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ezilier.Application.Handlers.Workers;

public record CreateWorkerCommand(
    CreateWorkerRequest Request,
    Guid BeneficiaryId
) : IRequest<(WorkerModel? Model, ValidationResult? ValidationResult, int StatusCode)>;

public class CreateWorkerCommandHandler(
    IDataContext context
) : IRequestHandler<CreateWorkerCommand, (WorkerModel? Model, ValidationResult? ValidationResult, int StatusCode)>
{
    public async Task<(WorkerModel? Model, ValidationResult? ValidationResult, int StatusCode)> Handle(
        CreateWorkerCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;
        var beneficiaryId = command.BeneficiaryId;
        var failures = new List<ValidationFailure>();

        if (beneficiaryId == Guid.Empty)
        {
            failures.Add(new ValidationFailure("BeneficiaryId", "Beneficiar lipseste in contextul cererii."));
            return (null, new ValidationResult(failures), 400);
        }

        var idnp = (request.Idnp ?? string.Empty).Trim();
        var firstName = (request.FirstName ?? string.Empty).Trim();
        var lastName = (request.LastName ?? string.Empty).Trim();
        var phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone!.Trim();
        var email = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email!.Trim();

        if (idnp.Length != 13 || !idnp.All(char.IsDigit))
        {
            failures.Add(new ValidationFailure("Idnp", "IDNP trebuie sa contina exact 13 cifre."));
        }
        if (string.IsNullOrEmpty(firstName))
        {
            failures.Add(new ValidationFailure("FirstName", "Prenumele este obligatoriu."));
        }
        if (string.IsNullOrEmpty(lastName))
        {
            failures.Add(new ValidationFailure("LastName", "Numele este obligatoriu."));
        }
        if (request.BirthDate == default || request.BirthDate >= DateOnly.FromDateTime(DateTime.UtcNow))
        {
            failures.Add(new ValidationFailure("BirthDate", "Data nasterii este obligatorie si trebuie sa fie in trecut."));
        }
        if (phone is not null && !IsValidOptionalPhone(phone))
        {
            failures.Add(new ValidationFailure("Phone", "Telefon invalid: 7-15 cifre, doar +, spatii, - sau ()."));
        }
        if (email is not null && !IsValidOptionalEmail(email))
        {
            failures.Add(new ValidationFailure("Email", "Format email invalid."));
        }

        if (failures.Count > 0)
        {
            return (null, new ValidationResult(failures), 400);
        }

        var exists = await context.Workers
            .AnyAsync(w => w.Idnp == idnp && w.BeneficiaryId == beneficiaryId && !w.IsDeleted, cancellationToken);

        if (exists)
        {
            failures.Add(new ValidationFailure("Idnp", "Lucrator cu acest IDNP exista deja in registru."));
            return (null, new ValidationResult(failures), 409);
        }

        var worker = new Worker
        {
            Idnp = idnp,
            FirstName = firstName,
            LastName = lastName,
            BirthDate = request.BirthDate,
            Phone = phone,
            Email = email,
            BeneficiaryId = beneficiaryId,
            RspValidated = false,
        };

        context.Workers.Add(worker);
        await context.SaveChangesAsync(cancellationToken);

        var model = new WorkerModel
        {
            Id = worker.Id,
            Idnp = worker.Idnp,
            FirstName = worker.FirstName,
            LastName = worker.LastName,
            BirthDate = worker.BirthDate,
            Phone = worker.Phone,
            Email = worker.Email,
            RspValidated = worker.RspValidated,
            RspValidatedAt = worker.RspValidatedAt,
            RspErrorMessage = worker.RspErrorMessage,
            IsActive = worker.IsActive,
            VoucherCount = 0,
            CreatedAt = worker.CreatedAt,
        };

        return (model, null, 201);
    }

    private static bool IsValidOptionalEmail(string value)
    {
        // Mirrors frontend optionalEmailValidator
        return System.Text.RegularExpressions.Regex.IsMatch(
            value, @"^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$");
    }

    private static bool IsValidOptionalPhone(string value)
    {
        // Mirrors frontend optionalPhoneValidator
        if (!System.Text.RegularExpressions.Regex.IsMatch(value, @"^[+\d\s\-()]+$")) return false;
        var digits = new string(value.Where(char.IsDigit).ToArray());
        return digits.Length >= 7 && digits.Length <= 15;
    }
}
