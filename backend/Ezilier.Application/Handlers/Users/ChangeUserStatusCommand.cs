using Ezilier.Application.Interfaces;
using Ezilier.Application.Models;
using Ezilier.Domain.Enums;
using FluentValidation.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ezilier.Application.Handlers.Users;

public record ChangeUserStatusCommand(
    Guid Id,
    ChangeUserStatusRequest Request
) : IRequest<(UserDetailModel? Model, ValidationResult? ValidationResult, int StatusCode)>;

public class ChangeUserStatusCommandHandler(
    IDataContext context
) : IRequestHandler<ChangeUserStatusCommand, (UserDetailModel? Model, ValidationResult? ValidationResult, int StatusCode)>
{
    public async Task<(UserDetailModel? Model, ValidationResult? ValidationResult, int StatusCode)> Handle(
        ChangeUserStatusCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;

        if (request.Status is not (UserStatus.Active or UserStatus.Blocked))
        {
            return (null, new ValidationResult(
                [new ValidationFailure("Status", "Statusul poate fi doar Active sau Blocked.")]), 400);
        }

        var identity = await context.UserIdentities
            .Include(ui => ui.User)
            .Include(ui => ui.Role)
            .Include(ui => ui.Beneficiary)
            .Include(ui => ui.Permissions)
                .ThenInclude(up => up.Permission)
            .Where(ui => !ui.IsDeleted && !ui.User.IsDeleted)
            .FirstOrDefaultAsync(ui => ui.UserId == command.Id, cancellationToken);

        if (identity is null)
        {
            return (null, new ValidationResult(
                [new ValidationFailure("Id", "Utilizatorul nu a fost gasit.")]), 404);
        }

        if (identity.Status == request.Status)
        {
            return (null, new ValidationResult(
                [new ValidationFailure("Status",
                    $"Utilizatorul are deja statusul {request.Status}.")]), 400);
        }

        identity.Status = request.Status;
        identity.UpdatedAt = DateTimeOffset.UtcNow;

        await context.SaveChangesAsync(cancellationToken);

        var model = GetUserQueryHandler.MapToDetailModel(identity);

        return (model, null, 200);
    }
}
