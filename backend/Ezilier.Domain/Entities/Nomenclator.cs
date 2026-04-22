namespace Ezilier.Domain.Entities;

public class Nomenclator : EntityBase
{
    public string Category { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string TitleRo { get; set; } = string.Empty;
    public string? TitleRu { get; set; }
    public string? TitleEn { get; set; }
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }
}
