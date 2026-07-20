using Ezilier.Application.Interfaces;
using Ezilier.Application.Models;
using Ezilier.Domain.Enums;
using FluentValidation.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ezilier.Application.Handlers.Vouchers;

public record SignVoucherCommand(
    Guid Id,
    SignVoucherRequest Request
) : IRequest<(VoucherDetailModel? Model, ValidationResult? ValidationResult, int StatusCode)>;

public class SignVoucherCommandHandler(
    IDataContext context
) : IRequestHandler<SignVoucherCommand, (VoucherDetailModel? Model, ValidationResult? ValidationResult, int StatusCode)>
{
    public async Task<(VoucherDetailModel? Model, ValidationResult? ValidationResult, int StatusCode)> Handle(
        SignVoucherCommand command, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(command.Request.SignatureDataUrl) ||
            !command.Request.SignatureDataUrl.StartsWith("data:image/"))
        {
            return (null, new ValidationResult(
                [new ValidationFailure("SignatureDataUrl", "Semnatura este invalida.")]), 400);
        }

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
                    $"Voucherul poate fi semnat doar din starea Activ. Starea curenta: {voucher.Status}.")]), 400);
        }

        // Semnatura este ireversibila: un voucher deja semnat nu poate fi resemnat.
        if (!string.IsNullOrEmpty(voucher.SignatureDataUrl))
        {
            return (null, new ValidationResult(
                [new ValidationFailure("SignatureDataUrl", "Voucherul este deja semnat.")]), 400);
        }

        var now = DateTimeOffset.UtcNow;

        voucher.SignatureDataUrl = command.Request.SignatureDataUrl;
        voucher.SignedAt = now;
        voucher.UpdatedAt = now;

        // Semnarea executa voucherul: Activ -> Executat.
        voucher.Status = VoucherStatus.Executat;
        voucher.ExecutedAt = now;

        await context.SaveChangesAsync(cancellationToken);

        return (GetVoucherQueryHandler.MapToDetailModel(voucher), null, 200);
    }
}
