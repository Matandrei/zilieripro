using Ezilier.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ezilier.Infrastructure.Persistence.Configurations;

public class WorkerConfiguration : IEntityTypeConfiguration<Worker>
{
    public void Configure(EntityTypeBuilder<Worker> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Idnp).HasMaxLength(13).IsRequired();
        builder.Property(x => x.FirstName).HasMaxLength(100).IsRequired();
        builder.Property(x => x.LastName).HasMaxLength(100).IsRequired();
        builder.Property(x => x.Phone).HasMaxLength(20);
        builder.Property(x => x.Email).HasMaxLength(254);
        builder.Property(x => x.RspErrorMessage).HasMaxLength(500);

        builder.HasIndex(x => x.Idnp);
        builder.HasIndex(x => new { x.Idnp, x.BeneficiaryId }).IsUnique()
            .HasFilter("\"IsDeleted\" = false");

        builder.HasOne(x => x.Beneficiary).WithMany(x => x.Workers).HasForeignKey(x => x.BeneficiaryId);
    }
}
