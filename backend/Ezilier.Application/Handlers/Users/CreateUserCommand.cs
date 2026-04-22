using Ezilier.Application.Interfaces;
using Ezilier.Application.Models;
using Ezilier.Domain.Entities;
using Ezilier.Domain.Enums;
using FluentValidation.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ezilier.Application.Handlers.Users;

public record CreateUserCommand(
    CreateUserRequest Request
) : IRequest<(UserDetailModel? Model, ValidationResult? ValidationResult, int StatusCode)>;

public class CreateUserCommandHandler(
    IDataContext context
) : IRequestHandler<CreateUserCommand, (UserDetailModel? Model, ValidationResult? ValidationResult, int StatusCode)>
{
    public async Task<(UserDetailModel? Model, ValidationResult? ValidationResult, int StatusCode)> Handle(
        CreateUserCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;

        // Check for duplicate IDNP
        var existingUser = await context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Idnp == request.Idnp && !u.IsDeleted, cancellationToken);

        if (existingUser is not null)
        {
            return (null, new ValidationResult(
                [new ValidationFailure("Idnp", "Un utilizator cu acest IDNP exista deja.")]), 409);
        }

        // Validate role exists
        var role = await context.Roles
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == request.RoleId && !r.IsDeleted, cancellationToken);

        if (role is null)
        {
            return (null, new ValidationResult(
                [new ValidationFailure("RoleId", "Rolul selectat nu a fost gasit.")]), 400);
        }

        // Validate permissions exist
        if (request.PermissionIds.Count > 0)
        {
            var validPermissionCount = await context.Permissions
                .CountAsync(p => request.PermissionIds.Contains(p.Id) && !p.IsDeleted, cancellationToken);

            if (validPermissionCount != request.PermissionIds.Count)
            {
                return (null, new ValidationResult(
                    [new ValidationFailure("PermissionIds", "Una sau mai multe permisiuni nu au fost gasite.")]), 400);
            }
        }

        var user = new User
        {
            Idnp = request.Idnp,
            FirstName = request.FirstName,
            LastName = request.LastName,
            Email = request.Email,
            Phone = request.Phone,
            Language = request.Language ?? "ro"
        };

        var identity = new UserIdentity
        {
            UserId = user.Id,
            Status = UserStatus.Active,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            RoleId = request.RoleId,
            BeneficiaryId = request.BeneficiaryId,
            AssignedDistricts = request.AssignedDistricts
        };

        context.Users.Add(user);
        context.UserIdentities.Add(identity);

        foreach (var permissionId in request.PermissionIds)
        {
            context.UserPermissions.Add(new UserPermission
            {
                UserIdentityId = identity.Id,
                PermissionId = permissionId
            });
        }

        await context.SaveChangesAsync(cancellationToken);

        // Reload with navigation properties for response
        var savedIdentity = await context.UserIdentities
            .AsNoTracking()
            .Include(ui => ui.User)
            .Include(ui => ui.Role)
            .Include(ui => ui.Beneficiary)
            .Include(ui => ui.Permissions)
                .ThenInclude(up => up.Permission)
            .FirstAsync(ui => ui.Id == identity.Id, cancellationToken);

        var model = GetUserQueryHandler.MapToDetailModel(savedIdentity);

        return (model, null, 201);
    }
}
