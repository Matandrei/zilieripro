using Ezilier.Application.Interfaces;
using Ezilier.Application.Models;
using FluentValidation.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ezilier.Application.Handlers.Workers;

public record UpdateWorkerStatusCommand(
    Guid Id,
    bool IsActive
) : IRequest<(WorkerModel? Model, ValidationResult? ValidationResult, int StatusCode)>;

public class UpdateWorkerStatusCommandHandler(
    IDataContext context
) : IRequestHandler<UpdateWorkerStatusCommand, (WorkerModel? Model, ValidationResult? ValidationResult, int StatusCode)>
{
    public async Task<(WorkerModel? Model, ValidationResult? ValidationResult, int StatusCode)> Handle(
        UpdateWorkerStatusCommand command, CancellationToken cancellationToken)
    {
        var worker = await context.Workers
            .Include(w => w.Vouchers)
            .FirstOrDefaultAsync(w => w.Id == command.Id && !w.IsDeleted, cancellationToken);

        if (worker is null)
        {
            return (null, new ValidationResult(
                [new ValidationFailure("Id", "Lucratorul nu a fost gasit.")]), 404);
        }

        if (worker.IsActive != command.IsActive)
        {
            worker.IsActive = command.IsActive;
            worker.UpdatedAt = DateTimeOffset.UtcNow;
            await context.SaveChangesAsync(cancellationToken);
        }

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
            VoucherCount = worker.Vouchers.Count,
            CreatedAt = worker.CreatedAt
        };

        return (model, null, 200);
    }
}
