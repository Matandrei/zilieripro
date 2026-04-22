using Ezilier.Application.Interfaces;
using Ezilier.Application.Models;

namespace Ezilier.Infrastructure.Services;

/// <summary>
/// Mock RSP (Registrul de Stat al Populatiei) verification service.
/// In production, this would call MConnect API.
/// </summary>
public class MockRspVerificationService : IRspVerificationService
{
    private static readonly Dictionary<string, (string FirstName, string LastName, DateOnly BirthDate)> MockRspData = new()
    {
        ["2003400111111"] = ("Ion", "Popescu", new DateOnly(1985, 3, 15)),
        ["2003400222222"] = ("Maria", "Ionescu", new DateOnly(1990, 7, 22)),
        ["2003400333333"] = ("Vasile", "Rusu", new DateOnly(1978, 11, 5)),
        ["2003400444444"] = ("Elena", "Moraru", new DateOnly(1995, 1, 30)),
        ["2003400555555"] = ("Andrei", "Cojocaru", new DateOnly(1988, 6, 12)),
        ["2003400666666"] = ("Ana", "Lungu", new DateOnly(2000, 9, 18)),
        ["2003400777777"] = ("Dumitru", "Ceban", new DateOnly(1975, 4, 7)),
        ["2003400888888"] = ("Natalia", "Rotaru", new DateOnly(1992, 12, 25)),
        ["2003400999999"] = ("Gheorghe", "Botnaru", new DateOnly(1983, 8, 14)),
        ["2003400000000"] = ("Olga", "Munteanu", new DateOnly(1997, 2, 3)),
    };

    public Task<RspVerificationResult> VerifyWorkerAsync(string idnp, string firstName, string lastName, DateOnly birthDate)
    {
        if (string.IsNullOrWhiteSpace(idnp) || idnp.Length != 13)
        {
            return Task.FromResult(new RspVerificationResult
            {
                IsValid = false,
                ErrorMessage = "IDNP trebuie sa contina exact 13 caractere",
                FieldErrors = new Dictionary<string, string> { ["idnp"] = "Format IDNP invalid" }
            });
        }

        // Check if IDNP exists in mock data
        if (MockRspData.TryGetValue(idnp, out var rspData))
        {
            var errors = new Dictionary<string, string>();

            if (!string.Equals(firstName, rspData.FirstName, StringComparison.OrdinalIgnoreCase))
                errors["firstName"] = $"Prenumele nu corespunde datelor RSP";

            if (!string.Equals(lastName, rspData.LastName, StringComparison.OrdinalIgnoreCase))
                errors["lastName"] = $"Numele nu corespunde datelor RSP";

            if (birthDate != rspData.BirthDate)
                errors["birthDate"] = $"Data nasterii nu corespunde datelor RSP";

            if (errors.Count > 0)
            {
                return Task.FromResult(new RspVerificationResult
                {
                    IsValid = false,
                    ErrorMessage = "Datele introduse nu corespund datelor din RSP",
                    FieldErrors = errors
                });
            }

            return Task.FromResult(new RspVerificationResult { IsValid = true });
        }

        // For unknown IDNPs, accept all data (simulating RSP not found = new worker)
        return Task.FromResult(new RspVerificationResult { IsValid = true });
    }
}
