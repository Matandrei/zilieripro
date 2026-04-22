using Ezilier.Application.Handlers.Users;
using Ezilier.Application.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ezilier.Api.Controllers;

[Authorize]
public class UsersController : BaseApiController
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] UsersQueryParams queryParams)
    {
        var (model, errors, status) = await Mediator.Send(new GetUsersQuery(queryParams));
        return StatusCode(status, errors is not null ? errors : model);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var (model, errors, status) = await Mediator.Send(new GetUserQuery(id));
        return StatusCode(status, errors is not null ? errors : model);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUserRequest request)
    {
        var (model, errors, status) = await Mediator.Send(new CreateUserCommand(request));
        return StatusCode(status, errors is not null ? errors : model);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateUserRequest request)
    {
        var (model, errors, status) = await Mediator.Send(new UpdateUserCommand(id, request));
        return StatusCode(status, errors is not null ? errors : model);
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> ChangeStatus(Guid id, [FromBody] ChangeUserStatusRequest request)
    {
        var (model, errors, status) = await Mediator.Send(new ChangeUserStatusCommand(id, request));
        return StatusCode(status, errors is not null ? errors : model);
    }
}
