namespace Ezilier.Domain.Entities;

public class UserPermission : EntityBase
{
    public Guid UserIdentityId { get; set; }
    public Guid PermissionId { get; set; }

    public virtual UserIdentity UserIdentity { get; set; } = null!;
    public virtual Permission Permission { get; set; } = null!;
}
