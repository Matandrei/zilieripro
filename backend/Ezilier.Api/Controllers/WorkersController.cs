using Ezilier.Application.Handlers.Workers;
using Ezilier.Application.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ezilier.Api.Controllers;

[Authorize]
public class WorkersController : BaseApiController
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] WorkersQueryParams queryParams)
    {
        var adjusted = queryParams with { BeneficiaryId = queryParams.BeneficiaryId ?? CurrentBeneficiaryId };
        var (model, errors, status) = await Mediator.Send(new GetWorkersQuery(adjusted));
        return StatusCode(status, errors is not null ? errors : model);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var (model, errors, status) = await Mediator.Send(new GetWorkerQuery(id));
        return StatusCode(status, errors is not null ? errors : model);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateWorkerRequest request)
    {
        var (model, errors, status) = await Mediator.Send(new UpdateWorkerCommand(id, request));
        return StatusCode(status, errors is not null ? errors : model);
    }
}
