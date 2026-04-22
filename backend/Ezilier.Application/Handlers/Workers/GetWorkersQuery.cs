using Ezilier.Application.Interfaces;
using Ezilier.Application.Models;
using FluentValidation.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ezilier.Application.Handlers.Workers;

public record GetWorkersQuery(
    WorkersQueryParams Params
) : IRequest<(PaginatedResult<WorkerModel>? Model, ValidationResult? ValidationResult, int StatusCode)>;

public class GetWorkersQueryHandler(
    IDataContext context
) : IRequestHandler<GetWorkersQuery, (PaginatedResult<WorkerModel>? Model, ValidationResult? ValidationResult, int StatusCode)>
{
    public async Task<(PaginatedResult<WorkerModel>? Model, ValidationResult? ValidationResult, int StatusCode)> Handle(
        GetWorkersQuery query, CancellationToken cancellationToken)
    {
        var p = query.Params;

        var q = context.Workers
            .AsNoTracking()
            .Where(w => !w.IsDeleted)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(p.Idnp))
        {
            q = q.Where(w => w.Idnp == p.Idnp);
        }

        if (p.BeneficiaryId.HasValue)
        {
            q = q.Where(w => w.BeneficiaryId == p.BeneficiaryId.Value);
        }

        if (!string.IsNullOrWhiteSpace(p.Search))
        {
            var search = p.Search.Trim().ToLower();
            q = q.Where(w =>
                w.Idnp.Contains(search) ||
                w.FirstName.ToLower().Contains(search) ||
                w.LastName.ToLower().Contains(search));
        }

        q = q.OrderBy(w => w.LastName).ThenBy(w => w.FirstName);

        var totalCount = await q.CountAsync(cancellationToken);

        var items = await q
            .Skip(p.Offset)
            .Take(p.Limit)
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
            .ToListAsync(cancellationToken);

        var result = new PaginatedResult<WorkerModel>
        {
            Items = items,
            TotalCount = totalCount,
            Offset = p.Offset,
            Limit = p.Limit
        };

        return (result, null, 200);
    }
}
