using Ezilier.Application.Interfaces;
using Ezilier.Application.Models;
using Ezilier.Domain.Enums;
using FluentValidation.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ezilier.Application.Handlers.Vouchers;

public record ReportVoucherCommand(
    Guid Id,
    string ReportPeriod
) : IRequest<(VoucherDetailModel? Model, ValidationResult? ValidationResult, int StatusCode)>;

public class ReportVoucherCommandHandler(
    IDataContext context
) : IRequestHandler<ReportVoucherCommand, (VoucherDetailModel? Model, ValidationResult? ValidationResult, int StatusCode)>
{
    public async Task<(VoucherDetailModel? Model, ValidationResult? ValidationResult, int StatusCode)> Handle(
        ReportVoucherCommand command, CancellationToken cancellationToken)
    {
        var voucher = await context.Vouchers
            .Include(v => v.Worker)
            .Include(v => v.Beneficiary)
            .FirstOrDefaultAsync(v => v.Id == command.Id, cancellationToken);

        if (voucher is null)
        {
            return (null, new ValidationResult(
                [new ValidationFailure("Id", "Voucherul nu a fost gasit.")]), 404);
        }

        if (voucher.Status != VoucherStatus.Executat)
        {
            return (null, new ValidationResult(
                [new ValidationFailure("Status",
                    $"Voucherul poate fi raportat doar din starea Executat. Starea curenta: {voucher.Status}.")]), 400);
        }

        if (string.IsNullOrWhiteSpace(command.ReportPeriod))
        {
            return (null, new ValidationResult(
                [new ValidationFailure("ReportPeriod", "Perioada de raportare este obligatorie.")]), 400);
        }

        voucher.Status = VoucherStatus.Raportat;
        voucher.ReportedAt = DateTimeOffset.UtcNow;
        voucher.ReportPeriod = command.ReportPeriod;
        voucher.UpdatedAt = DateTimeOffset.UtcNow;

        await context.SaveChangesAsync(cancellationToken);

        var model = GetVoucherQueryHandler.MapToDetailModel(voucher);

        return (model, null, 200);
    }
}
