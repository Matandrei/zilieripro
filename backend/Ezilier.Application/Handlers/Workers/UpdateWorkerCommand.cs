using Ezilier.Application.Interfaces;
using Ezilier.Application.Models;
using FluentValidation.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ezilier.Application.Handlers.Workers;

public record UpdateWorkerCommand(
    Guid Id,
    UpdateWorkerRequest Request
) : IRequest<(WorkerModel? Model, ValidationResult? ValidationResult, int StatusCode)>;

public class UpdateWorkerCommandHandler(
    IDataContext context
) : IRequestHandler<UpdateWorkerCommand, (WorkerModel? Model, ValidationResult? ValidationResult, int StatusCode)>
{
    public async Task<(WorkerModel? Model, ValidationResult? ValidationResult, int StatusCode)> Handle(
        UpdateWorkerCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;

        var worker = await context.Workers
            .Include(w => w.Vouchers)
            .FirstOrDefaultAsync(w => w.Id == command.Id && !w.IsDeleted, cancellationToken);

        if (worker is null)
        {
            return (null, new ValidationResult(
                [new ValidationFailure("Id", "Lucratorul nu a fost gasit.")]), 404);
        }

        if (request.Phone is not null)
        {
            worker.Phone = request.Phone;
        }

        if (request.Email is not null)
        {
            worker.Email = request.Email;
        }

        worker.UpdatedAt = DateTimeOffset.UtcNow;

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
            VoucherCount = worker.Vouchers.Count,
            CreatedAt = worker.CreatedAt
        };

        return (model, null, 200);
    }
}
