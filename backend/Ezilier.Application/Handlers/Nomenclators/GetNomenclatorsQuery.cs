using Ezilier.Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ezilier.Application.Handlers.Nomenclators;

public record NomenclatorModel(
    Guid Id,
    string Category,
    string Code,
    string TitleRo,
    string? TitleRu,
    string? TitleEn,
    bool IsActive,
    int SortOrder
);

public record GetNomenclatorsQuery(
    string Category,
    bool OnlyActive = true
) : IRequest<List<NomenclatorModel>>;

public class GetNomenclatorsQueryHandler(
    IDataContext context
) : IRequestHandler<GetNomenclatorsQuery, List<NomenclatorModel>>
{
    public async Task<List<NomenclatorModel>> Handle(
        GetNomenclatorsQuery query, CancellationToken cancellationToken)
    {
        var nomenclatorsQuery = context.Nomenclators
            .AsNoTracking()
            .Where(n => n.Category == query.Category && !n.IsDeleted);

        if (query.OnlyActive)
            nomenclatorsQuery = nomenclatorsQuery.Where(n => n.IsActive);

        var nomenclators = await nomenclatorsQuery
            .OrderBy(n => n.SortOrder)
            .ThenBy(n => n.TitleRo)
            .Select(n => new NomenclatorModel(
                n.Id,
                n.Category,
                n.Code,
                n.TitleRo,
                n.TitleRu,
                n.TitleEn,
                n.IsActive,
                n.SortOrder
            ))
            .ToListAsync(cancellationToken);

        return nomenclators;
    }
}
