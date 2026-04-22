using Ezilier.Application.Handlers.Beneficiaries;
using Ezilier.Application.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ezilier.Api.Controllers;

[Authorize]
public class BeneficiariesController : BaseApiController
{
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterBeneficiaryRequest request)
    {
        var (model, errors, status) = await Mediator.Send(new RegisterBeneficiaryCommand(request));
        return StatusCode(status, errors is not null ? errors : model);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var (model, errors, status) = await Mediator.Send(new GetBeneficiaryQuery(id));
        return StatusCode(status, errors is not null ? errors : model);
    }
}
