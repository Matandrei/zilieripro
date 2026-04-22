using Ezilier.Application.Handlers.Nomenclators;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ezilier.Api.Controllers;

[Authorize]
public class NomenclatorsController : BaseApiController
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? category)
    {
        var model = await Mediator.Send(new GetNomenclatorsQuery(category ?? "", true));
        return Ok(model);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateNomenclatorCommand command)
    {
        var (model, errors, status) = await Mediator.Send(command);
        return StatusCode(status, errors is not null ? errors : model);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateNomenclatorCommand command)
    {
        var updated = command with { Id = id };
        var (model, errors, status) = await Mediator.Send(updated);
        return StatusCode(status, errors is not null ? errors : model);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Deactivate(Guid id)
    {
        var (model, errors, status) = await Mediator.Send(new DeactivateNomenclatorCommand(id));
        return StatusCode(status, errors is not null ? errors : model);
    }
}
