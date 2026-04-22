using Ezilier.Application.Handlers.Vouchers;
using Ezilier.Application.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ezilier.Api.Controllers;

[Authorize]
public class VouchersController : BaseApiController
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] VouchersQueryParams queryParams)
    {
        var (model, errors, status) = await Mediator.Send(new GetVouchersQuery(queryParams, CurrentBeneficiaryId));
        return StatusCode(status, errors is not null ? errors : model);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateVoucherRequest request)
    {
        var beneficiaryId = CurrentBeneficiaryId ?? Guid.Empty;
        var (model, errors, status) = await Mediator.Send(new CreateVouchersCommand(request, beneficiaryId));
        return StatusCode(status, errors is not null ? errors : model);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var (model, errors, status) = await Mediator.Send(new GetVoucherQuery(id));
        return StatusCode(status, errors is not null ? errors : model);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Edit(Guid id, [FromBody] EditVoucherRequest request)
    {
        var (model, errors, status) = await Mediator.Send(new EditVoucherCommand(id, request));
        return StatusCode(status, errors is not null ? errors : model);
    }

    [HttpPost("{id:guid}/activate")]
    public async Task<IActionResult> Activate(Guid id)
    {
        var (model, errors, status) = await Mediator.Send(new ActivateVoucherCommand(id));
        return StatusCode(status, errors is not null ? errors : model);
    }

    [HttpPost("{id:guid}/execute")]
    public async Task<IActionResult> Execute(Guid id)
    {
        var (model, errors, status) = await Mediator.Send(new ExecuteVoucherCommand(id));
        return StatusCode(status, errors is not null ? errors : model);
    }

    [HttpPost("{id:guid}/report")]
    public async Task<IActionResult> Report(Guid id, [FromBody] string reportPeriod)
    {
        var (model, errors, status) = await Mediator.Send(new ReportVoucherCommand(id, reportPeriod));
        return StatusCode(status, errors is not null ? errors : model);
    }

    [HttpPost("{id:guid}/cancel")]
    public async Task<IActionResult> Cancel(Guid id, [FromBody] CancelVoucherRequest request)
    {
        var (model, errors, status) = await Mediator.Send(new CancelVoucherCommand(id, request));
        return StatusCode(status, errors is not null ? errors : model);
    }
}
