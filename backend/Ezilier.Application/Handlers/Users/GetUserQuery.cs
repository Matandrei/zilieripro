using Ezilier.Application.Interfaces;
using Ezilier.Application.Models;
using FluentValidation.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ezilier.Application.Handlers.Users;

public record GetUserQuery(
    Guid Id
) : IRequest<(UserDetailModel? Model, ValidationResult? ValidationResult, int StatusCode)>;

public class GetUserQueryHandler(
    IDataContext context
) : IRequestHandler<GetUserQuery, (UserDetailModel? Model, ValidationResult? ValidationResult, int StatusCode)>
{
    public async Task<(UserDetailModel? Model, ValidationResult? ValidationResult, int StatusCode)> Handle(
        GetUserQuery query, CancellationToken cancellationToken)
    {
        var identity = await context.UserIdentities
            .AsNoTracking()
            .Include(ui => ui.User)
            .Include(ui => ui.Role)
            .Include(ui => ui.Beneficiary)
            .Include(ui => ui.Permissions)
                .ThenInclude(up => up.Permission)
            .Where(ui => !ui.IsDeleted && !ui.User.IsDeleted)
            .FirstOrDefaultAsync(ui => ui.UserId == query.Id, cancellationToken);

        if (identity is null)
        {
            return (null, new ValidationResult(
                [new ValidationFailure("Id", "Utilizatorul nu a fost gasit.")]), 404);
        }

        var model = MapToDetailModel(identity);

        return (model, null, 200);
    }

    internal static UserDetailModel MapToDetailModel(Domain.Entities.UserIdentity identity)
    {
        return new UserDetailModel
        {
            Id = identity.UserId,
            Idnp = identity.User.Idnp,
            FirstName = identity.User.FirstName,
            LastName = identity.User.LastName,
            BirthDate = identity.User.BirthDate,
            Email = identity.User.Email,
            Phone = identity.User.Phone,
            Language = identity.User.Language,
            Status = identity.Status,
            RoleName = identity.Role.Title,
            RoleId = identity.RoleId,
            BeneficiaryId = identity.BeneficiaryId,
            BeneficiaryName = identity.Beneficiary?.CompanyName,
            AssignedDistricts = identity.AssignedDistricts,
            Permissions = identity.Permissions
                .Select(p => p.Permission.Key)
                .ToList(),
            CreatedAt = identity.CreatedAt
        };
    }
}
