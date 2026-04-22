namespace Ezilier.Domain.Entities;

public class Permission : EntityBase
{
    public string Key { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }

    public Guid RoleId { get; set; }
    public virtual Role Role { get; set; } = null!;
}
