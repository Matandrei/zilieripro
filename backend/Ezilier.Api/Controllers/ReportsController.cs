using System.Text.RegularExpressions;
using Ezilier.Application.Handlers.Reports;
using Ezilier.Application.Models;
using FluentValidation.Results;
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

    [HttpPost("ipc21/export")]
    public async Task<IActionResult> ExportIpc21([FromBody] ExportIpc21Request request)
    {
        // Period format + window validation (yyyy-MM, not in future, not older than 24 months).
        if (string.IsNullOrWhiteSpace(request.Period) ||
            !Regex.IsMatch(request.Period, @"^\d{4}-\d{2}$") ||
            !DateOnly.TryParseExact(request.Period + "-01", "yyyy-MM-dd", out var periodFirstDay))
        {
            return StatusCode(400, new ValidationResult(
                [new ValidationFailure("Period", "Formatul perioadei este invalid. Folositi yyyy-MM.")]));
        }

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var currentMonthFirstDay = new DateOnly(today.Year, today.Month, 1);
        if (periodFirstDay > currentMonthFirstDay)
        {
            return StatusCode(400, new ValidationResult(
                [new ValidationFailure("Period", "Perioada nu poate fi in viitor.")]));
        }

        var oldestAllowed = currentMonthFirstDay.AddMonths(-24);
        if (periodFirstDay < oldestAllowed)
        {
            return StatusCode(400, new ValidationResult(
                [new ValidationFailure("Period", "Perioada este prea veche (limita: 24 luni).")]));
        }

        // Permissions: Inspector / Zilier -> 403; Administrator -> request body; Angajator -> own beneficiary.
        var role = (CurrentRole ?? string.Empty).Trim();
        if (string.Equals(role, "inspector", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(role, "zilier", StringComparison.OrdinalIgnoreCase))
        {
            return Forbid();
        }

        Guid beneficiaryId;
        if (string.Equals(role, "administrator", StringComparison.OrdinalIgnoreCase))
        {
            if (!request.BeneficiaryId.HasValue || request.BeneficiaryId.Value == Guid.Empty)
            {
                return StatusCode(400, new ValidationResult(
                    [new ValidationFailure("BeneficiaryId", "BeneficiaryId este obligatoriu pentru administrator.")]));
            }
            beneficiaryId = request.BeneficiaryId.Value;
        }
        else
        {
            beneficiaryId = CurrentBeneficiaryId ?? Guid.Empty;
            if (beneficiaryId == Guid.Empty)
            {
                return StatusCode(400, new ValidationResult(
                    [new ValidationFailure("BeneficiaryId", "Beneficiar lipseste in contextul cererii.")]));
            }
        }

        var (pdf, fileName, errors, status) = await Mediator.Send(
            new ExportIpc21PdfCommand(beneficiaryId, request.Period));

        if (status != 200 || pdf is null)
        {
            return StatusCode(status, errors);
        }

        return File(pdf, "application/pdf", fileName);
    }

    [HttpGet("statistics")]
    public async Task<IActionResult> GetStatistics([FromQuery] StatisticsQueryParams queryParams)
    {
        var role = (CurrentRole ?? string.Empty).Trim();
        if (string.Equals(role, "angajator", StringComparison.OrdinalIgnoreCase))
        {
            var beneficiaryId = CurrentBeneficiaryId ?? Guid.Empty;
            if (beneficiaryId == Guid.Empty)
                return StatusCode(400, new ValidationResult(
                    [new ValidationFailure("BeneficiaryId", "Beneficiar lipseste in contextul cererii.")]));
            queryParams = queryParams with { BeneficiaryId = beneficiaryId };
        }

        var (model, errors, status) = await Mediator.Send(new GetStatisticsQuery(queryParams));
        return StatusCode(status, errors is not null ? errors : model);
    }

    [HttpGet("statistics/export-csv")]
    public async Task<IActionResult> ExportStatisticsCsv([FromQuery] StatisticsQueryParams queryParams)
    {
        var role = (CurrentRole ?? string.Empty).Trim();
        if (string.Equals(role, "angajator", StringComparison.OrdinalIgnoreCase))
        {
            var beneficiaryId = CurrentBeneficiaryId ?? Guid.Empty;
            if (beneficiaryId == Guid.Empty)
                return StatusCode(400, new ValidationResult(
                    [new ValidationFailure("BeneficiaryId", "Beneficiar lipseste in contextul cererii.")]));
            queryParams = queryParams with { BeneficiaryId = beneficiaryId };
        }

        var (csv, fileName, errors, status) = await Mediator.Send(new ExportStatisticsCsvQuery(queryParams));
        if (status != 200 || csv is null)
            return StatusCode(status, errors);

        return File(csv, "text/csv; charset=utf-8", fileName);
    }

    [HttpGet("daily-register")]
    public async Task<IActionResult> GetDailyRegister([FromQuery] Guid beneficiaryId, [FromQuery] DateOnly date)
    {
        var (model, errors, status) = await Mediator.Send(new GetDailyRegisterQuery(beneficiaryId, date));
        return StatusCode(status, errors is not null ? errors : model);
    }
}
