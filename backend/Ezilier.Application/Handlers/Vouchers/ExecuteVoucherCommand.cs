using Ezilier.Application.Interfaces;
using Ezilier.Application.Models;
using Ezilier.Domain.Enums;
using FluentValidation.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ezilier.Application.Handlers.Vouchers;

public record ExecuteVoucherCommand(
    Guid Id
) : IRequest<(VoucherDetailModel? Model, ValidationResult? ValidationResult, int StatusCode)>;

public class ExecuteVoucherCommandHandler(
    IDataContext context
) : IRequestHandler<ExecuteVoucherCommand, (VoucherDetailModel? Model, ValidationResult? ValidationResult, int StatusCode)>
{
    public async Task<(VoucherDetailModel? Model, ValidationResult? ValidationResult, int StatusCode)> Handle(
        ExecuteVoucherCommand command, CancellationToken cancellationToken)
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

        if (voucher.Status != VoucherStatus.Activ)
        {
            return (null, new ValidationResult(
                [new ValidationFailure("Status",
                    $"Voucherul poate fi executat doar din starea Activ. Starea curenta: {voucher.Status}.")]), 400);
        }

        voucher.Status = VoucherStatus.Executat;
        voucher.ExecutedAt = DateTimeOffset.UtcNow;
        voucher.UpdatedAt = DateTimeOffset.UtcNow;

        await context.SaveChangesAsync(cancellationToken);

        var model = GetVoucherQueryHandler.MapToDetailModel(voucher);

        return (model, null, 200);
    }
}
