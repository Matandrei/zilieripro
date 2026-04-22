using Ezilier.Application.Interfaces;
using Ezilier.Domain.Entities;
using FluentValidation.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ezilier.Application.Handlers.Nomenclators;

// --- Create ---

public record CreateNomenclatorCommand(
    string Category,
    string Code,
    string TitleRo,
    string? TitleRu,
    string? TitleEn,
    int SortOrder
) : IRequest<(NomenclatorModel? Model, ValidationResult? ValidationResult, int StatusCode)>;

public class CreateNomenclatorCommandHandler(
    IDataContext context
) : IRequestHandler<CreateNomenclatorCommand, (NomenclatorModel? Model, ValidationResult? ValidationResult, int StatusCode)>
{
    public async Task<(NomenclatorModel? Model, ValidationResult? ValidationResult, int StatusCode)> Handle(
        CreateNomenclatorCommand command, CancellationToken cancellationToken)
    {
        var failures = new List<ValidationFailure>();

        if (string.IsNullOrWhiteSpace(command.Category))
            failures.Add(new ValidationFailure("Category", "Categoria este obligatorie."));

        if (string.IsNullOrWhiteSpace(command.Code))
            failures.Add(new ValidationFailure("Code", "Codul este obligatoriu."));

        if (string.IsNullOrWhiteSpace(command.TitleRo))
            failures.Add(new ValidationFailure("TitleRo", "Titlul in romana este obligatoriu."));

        if (failures.Count > 0)
            return (null, new ValidationResult(failures), 400);

        // Check for duplicate code within the same category
        var duplicate = await context.Nomenclators
            .AnyAsync(n => n.Category == command.Category && n.Code == command.Code && !n.IsDeleted,
                cancellationToken);

        if (duplicate)
        {
            return (null, new ValidationResult(
                [new ValidationFailure("Code", "Un nomenclator cu acest cod exista deja in aceasta categorie.")]), 409);
        }

        var nomenclator = new Nomenclator
        {
            Category = command.Category,
            Code = command.Code,
            TitleRo = command.TitleRo,
            TitleRu = command.TitleRu,
            TitleEn = command.TitleEn,
            IsActive = true,
            SortOrder = command.SortOrder
        };

        context.Nomenclators.Add(nomenclator);
        await context.SaveChangesAsync(cancellationToken);

        var model = new NomenclatorModel(
            nomenclator.Id,
            nomenclator.Category,
            nomenclator.Code,
            nomenclator.TitleRo,
            nomenclator.TitleRu,
            nomenclator.TitleEn,
            nomenclator.IsActive,
            nomenclator.SortOrder
        );

        return (model, null, 201);
    }
}

// --- Update ---

public record UpdateNomenclatorCommand(
    Guid Id,
    string TitleRo,
    string? TitleRu,
    string? TitleEn,
    bool IsActive,
    int SortOrder
) : IRequest<(NomenclatorModel? Model, ValidationResult? ValidationResult, int StatusCode)>;

public class UpdateNomenclatorCommandHandler(
    IDataContext context
) : IRequestHandler<UpdateNomenclatorCommand, (NomenclatorModel? Model, ValidationResult? ValidationResult, int StatusCode)>
{
    public async Task<(NomenclatorModel? Model, ValidationResult? ValidationResult, int StatusCode)> Handle(
        UpdateNomenclatorCommand command, CancellationToken cancellationToken)
    {
        var nomenclator = await context.Nomenclators
            .FirstOrDefaultAsync(n => n.Id == command.Id && !n.IsDeleted, cancellationToken);

        if (nomenclator is null)
        {
            return (null, new ValidationResult(
                [new ValidationFailure("Id", "Nomenclatorul nu a fost gasit.")]), 404);
        }

        if (string.IsNullOrWhiteSpace(command.TitleRo))
        {
            return (null, new ValidationResult(
                [new ValidationFailure("TitleRo", "Titlul in romana este obligatoriu.")]), 400);
        }

        nomenclator.TitleRo = command.TitleRo;
        nomenclator.TitleRu = command.TitleRu;
        nomenclator.TitleEn = command.TitleEn;
        nomenclator.IsActive = command.IsActive;
        nomenclator.SortOrder = command.SortOrder;
        nomenclator.UpdatedAt = DateTimeOffset.UtcNow;

        await context.SaveChangesAsync(cancellationToken);

        var model = new NomenclatorModel(
            nomenclator.Id,
            nomenclator.Category,
            nomenclator.Code,
            nomenclator.TitleRo,
            nomenclator.TitleRu,
            nomenclator.TitleEn,
            nomenclator.IsActive,
            nomenclator.SortOrder
        );

        return (model, null, 200);
    }
}

// --- Deactivate (soft-delete) ---

public record DeactivateNomenclatorCommand(
    Guid Id
) : IRequest<(NomenclatorModel? Model, ValidationResult? ValidationResult, int StatusCode)>;

public class DeactivateNomenclatorCommandHandler(
    IDataContext context
) : IRequestHandler<DeactivateNomenclatorCommand, (NomenclatorModel? Model, ValidationResult? ValidationResult, int StatusCode)>
{
    public async Task<(NomenclatorModel? Model, ValidationResult? ValidationResult, int StatusCode)> Handle(
        DeactivateNomenclatorCommand command, CancellationToken cancellationToken)
    {
        var nomenclator = await context.Nomenclators
            .FirstOrDefaultAsync(n => n.Id == command.Id && !n.IsDeleted, cancellationToken);

        if (nomenclator is null)
        {
            return (null, new ValidationResult(
                [new ValidationFailure("Id", "Nomenclatorul nu a fost gasit.")]), 404);
        }

        nomenclator.IsActive = false;
        nomenclator.UpdatedAt = DateTimeOffset.UtcNow;

        await context.SaveChangesAsync(cancellationToken);

        var model = new NomenclatorModel(
            nomenclator.Id,
            nomenclator.Category,
            nomenclator.Code,
            nomenclator.TitleRo,
            nomenclator.TitleRu,
            nomenclator.TitleEn,
            nomenclator.IsActive,
            nomenclator.SortOrder
        );

        return (model, null, 200);
    }
}
