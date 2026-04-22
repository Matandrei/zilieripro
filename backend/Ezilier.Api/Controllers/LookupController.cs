using Ezilier.Application.Handlers.Lookup;
using Microsoft.AspNetCore.Mvc;

namespace Ezilier.Api.Controllers;

public class LookupController : BaseApiController
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var model = await Mediator.Send(new GetLookupsQuery());
        return Ok(model);
    }
}
