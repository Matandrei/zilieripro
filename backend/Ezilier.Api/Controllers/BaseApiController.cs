using MediatR;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Ezilier.Api.Controllers;

[ApiController]
[Route("api/zilieri/[controller]")]
public abstract class BaseApiController : ControllerBase
{
    private ISender? _mediator;
    protected ISender Mediator => _mediator ??= HttpContext.RequestServices.GetRequiredService<ISender>();

    protected Guid CurrentUserId => Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : Guid.Empty;
    protected string CurrentRole => User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
    protected Guid? CurrentBeneficiaryId => Guid.TryParse(User.FindFirstValue("beneficiary_id"), out var id) ? id : null;
}
