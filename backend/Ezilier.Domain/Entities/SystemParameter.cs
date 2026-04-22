namespace Ezilier.Domain.Entities;

public class SystemParameter : EntityBase
{
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string ValueType { get; set; } = "int";
}
