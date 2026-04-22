using Ezilier.Application.Interfaces;
using Ezilier.Application.Models;
using FluentValidation.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ezilier.Application.Handlers.Workers;

public record GetWorkerQuery(
    Guid Id
) : IRequest<(WorkerModel? Model, ValidationResult? ValidationResult, int StatusCode)>;

public class GetWorkerQueryHandler(
    IDataContext context
) : IRequestHandler<GetWorkerQuery, (WorkerModel? Model, ValidationResult? ValidationResult, int StatusCode)>
{
    public async Task<(WorkerModel? Model, ValidationResult? ValidationResult, int StatusCode)> Handle(
        GetWorkerQuery query, CancellationToken cancellationToken)
    {
        var worker = await context.Workers
            .AsNoTracking()
            .Where(w => !w.IsDeleted)
            .Select(w => new WorkerModel
            {
                Id = w.Id,
                Idnp = w.Idnp,
                FirstName = w.FirstName,
                LastName = w.LastName,
                BirthDate = w.BirthDate,
                Phone = w.Phone,
                Email = w.Email,
                RspValidated = w.RspValidated,
                RspValidatedAt = w.RspValidatedAt,
                RspErrorMessage = w.RspErrorMessage,
                VoucherCount = w.Vouchers.Count,
                CreatedAt = w.CreatedAt
            })
            .FirstOrDefaultAsync(w => w.Id == query.Id, cancellationToken);

        if (worker is null)
        {
            return (null, new ValidationResult(
                [new ValidationFailure("Id", "Lucratorul nu a fost gasit.")]), 404);
        }

        return (worker, null, 200);
    }
}
