using Ezilier.Application.Handlers.Reports;
using Ezilier.Application.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ezilier.Api.Controllers;

[Authorize]
public class ReportsController : BaseApiController
{
    [HttpGet("ipc21")]
    public async Task<IActionResult> GetIpc21([FromQuery] Guid beneficiaryId, [FromQuery] string period)
    {
        var (model, errors, status) = await Mediator.Send(new GetIpc21ReportQuery(beneficiaryId, period));
        return StatusCode(status, errors is not null ? errors : model);
    }

    [HttpGet("statistics")]
    public async Task<IActionResult> GetStatistics([FromQuery] StatisticsQueryParams queryParams)
    {
        var (model, errors, status) = await Mediator.Send(new GetStatisticsQuery(queryParams));
        return StatusCode(status, errors is not null ? errors : model);
    }

    [HttpGet("daily-register")]
    public async Task<IActionResult> GetDailyRegister([FromQuery] Guid beneficiaryId, [FromQuery] DateOnly date)
    {
        var (model, errors, status) = await Mediator.Send(new GetDailyRegisterQuery(beneficiaryId, date));
        return StatusCode(status, errors is not null ? errors : model);
    }
}
