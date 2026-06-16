using Ezilier.Application.Interfaces;
using FluentValidation.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ezilier.Application.Handlers.Vouchers;

public record GetVoucherTagsQuery(
    Guid? BeneficiaryId
) : IRequest<(List<string>? Tags, ValidationResult? ValidationResult, int StatusCode)>;

public class GetVoucherTagsQueryHandler(
    IDataContext context
) : IRequestHandler<GetVoucherTagsQuery, (List<string>? Tags, ValidationResult? ValidationResult, int StatusCode)>
{
    public async Task<(List<string>? Tags, ValidationResult? ValidationResult, int StatusCode)> Handle(
        GetVoucherTagsQuery query, CancellationToken cancellationToken)
    {
        var q = context.Vouchers.AsNoTracking().Where(v => v.Tag != null && v.Tag != string.Empty);

        if (query.BeneficiaryId.HasValue)
        {
            q = q.Where(v => v.BeneficiaryId == query.BeneficiaryId.Value);
        }

        var tags = await q
            .Select(v => v.Tag!)
            .Distinct()
            .OrderBy(t => t)
            .ToListAsync(cancellationToken);

        return (tags, null, 200);
    }
}
