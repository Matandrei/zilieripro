using Ezilier.Application.Interfaces;
using Ezilier.Application.Models;
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

        voucher.SignatureDataUrl = command.Request.SignatureDataUrl;
        voucher.SignedAt = DateTimeOffset.UtcNow;
        voucher.UpdatedAt = DateTimeOffset.UtcNow;

        await context.SaveChangesAsync(cancellationToken);

        return (GetVoucherQueryHandler.MapToDetailModel(voucher), null, 200);
    }
}
