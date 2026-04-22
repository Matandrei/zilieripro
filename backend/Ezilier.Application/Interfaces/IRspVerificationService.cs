using Ezilier.Application.Models;

namespace Ezilier.Application.Interfaces;

public interface IRspVerificationService
{
    Task<RspVerificationResult> VerifyWorkerAsync(string idnp, string firstName, string lastName, DateOnly birthDate);
}
