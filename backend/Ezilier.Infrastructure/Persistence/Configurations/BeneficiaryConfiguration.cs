using Ezilier.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ezilier.Infrastructure.Persistence.Configurations;

public class BeneficiaryConfiguration : IEntityTypeConfiguration<Beneficiary>
{
    public void Configure(EntityTypeBuilder<Beneficiary> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Idno).HasMaxLength(13).IsRequired();
        builder.Property(x => x.CompanyName).HasMaxLength(300).IsRequired();
        builder.Property(x => x.LegalForm).HasMaxLength(100);
        builder.Property(x => x.ActivityType).HasMaxLength(200);
        builder.Property(x => x.Address).HasMaxLength(500);
        builder.Property(x => x.District).HasMaxLength(100);
        builder.Property(x => x.Locality).HasMaxLength(200);
        builder.Property(x => x.Phone).HasMaxLength(20);
        builder.Property(x => x.Email).HasMaxLength(254);

        builder.HasIndex(x => x.Idno).IsUnique().HasFilter("\"IsDeleted\" = false");
    }
}
