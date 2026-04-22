using Ezilier.Domain.Enums;

namespace Ezilier.Domain.Entities;

public class Role : EntityBase
{
    public string Key { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public RoleType Type { get; set; }

    public virtual IList<Permission> Permissions { get; set; } = [];
    public virtual IList<UserIdentity> Users { get; set; } = [];
}
