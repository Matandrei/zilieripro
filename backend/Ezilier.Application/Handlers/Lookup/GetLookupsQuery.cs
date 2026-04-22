using Ezilier.Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ezilier.Application.Handlers.Lookup;

public record LookupModel
{
    public List<string> Districts { get; init; } = [];
    public Dictionary<string, string> SystemParams { get; init; } = [];
}

public record GetLookupsQuery : IRequest<LookupModel>;

public class GetLookupsQueryHandler(
    IDataContext context
) : IRequestHandler<GetLookupsQuery, LookupModel>
{
    public async Task<LookupModel> Handle(
        GetLookupsQuery query, CancellationToken cancellationToken)
    {
        // Load districts from nomenclators
        var districts = await context.Nomenclators
            .AsNoTracking()
            .Where(n => n.Category == "District" && n.IsActive && !n.IsDeleted)
            .OrderBy(n => n.SortOrder)
            .ThenBy(n => n.TitleRo)
            .Select(n => n.TitleRo)
            .ToListAsync(cancellationToken);

        // Load system parameters
        var systemParams = await context.SystemParameters
            .AsNoTracking()
            .Where(sp => !sp.IsDeleted)
            .ToDictionaryAsync(sp => sp.Key, sp => sp.Value, cancellationToken);

        return new LookupModel
        {
            Districts = districts,
            SystemParams = systemParams
        };
    }
}
