using Ezilier.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ezilier.Infrastructure.Persistence.Configurations;

public class NomenclatorConfiguration : IEntityTypeConfiguration<Nomenclator>
{
    public void Configure(EntityTypeBuilder<Nomenclator> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Category).HasMaxLength(100).IsRequired();
        builder.Property(x => x.Code).HasMaxLength(20).IsRequired();
        builder.Property(x => x.TitleRo).HasMaxLength(500).IsRequired();
        builder.Property(x => x.TitleRu).HasMaxLength(500);
        builder.Property(x => x.TitleEn).HasMaxLength(500);

        builder.HasIndex(x => new { x.Category, x.Code }).IsUnique().HasFilter("\"IsDeleted\" = false");
    }
}

public class SystemParameterConfiguration : IEntityTypeConfiguration<SystemParameter>
{
    public void Configure(EntityTypeBuilder<SystemParameter> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Key).HasMaxLength(100).IsRequired();
        builder.Property(x => x.Value).HasMaxLength(500).IsRequired();
        builder.Property(x => x.Description).HasMaxLength(500);
        builder.Property(x => x.ValueType).HasMaxLength(20);

        builder.HasIndex(x => x.Key).IsUnique().HasFilter("\"IsDeleted\" = false");
    }
}

public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Action).HasMaxLength(100).IsRequired();
        builder.Property(x => x.EntityType).HasMaxLength(100).IsRequired();
        builder.Property(x => x.UserName).HasMaxLength(200);
        builder.Property(x => x.IpAddress).HasMaxLength(50);

        builder.HasIndex(x => x.CreatedAt);
        builder.HasIndex(x => x.EntityType);
    }
}
