using Ezilier.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ezilier.Infrastructure.Persistence.Configurations;

public class VoucherConfiguration : IEntityTypeConfiguration<Voucher>
{
    public void Configure(EntityTypeBuilder<Voucher> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Code).HasMaxLength(50).IsRequired();
        builder.Property(x => x.NetRemuneration).HasPrecision(18, 2);
        builder.Property(x => x.IncomeTax).HasPrecision(18, 2);
        builder.Property(x => x.CnasContribution).HasPrecision(18, 2);
        builder.Property(x => x.GrossRemuneration).HasPrecision(18, 2);
        builder.Property(x => x.WorkDistrict).HasMaxLength(100);
        builder.Property(x => x.WorkLocality).HasMaxLength(200);
        builder.Property(x => x.WorkAddress).HasMaxLength(500);
        builder.Property(x => x.CancellationNote).HasMaxLength(500);
        builder.Property(x => x.ReportPeriod).HasMaxLength(20);

        builder.HasIndex(x => x.Code).IsUnique();
        builder.HasIndex(x => x.Status);
        builder.HasIndex(x => x.WorkDate);
        builder.HasIndex(x => new { x.WorkerId, x.WorkDate, x.BeneficiaryId }).IsUnique()
            .HasFilter("\"IsDeleted\" = false AND \"Status\" != 5");

        builder.HasOne(x => x.Beneficiary).WithMany(x => x.Vouchers).HasForeignKey(x => x.BeneficiaryId);
        builder.HasOne(x => x.Worker).WithMany(x => x.Vouchers).HasForeignKey(x => x.WorkerId);
    }
}
