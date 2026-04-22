using Ezilier.Application.Interfaces;
using Ezilier.Application.Models;

namespace Ezilier.Infrastructure.Services;

/// <summary>
/// Mock RSUD (Registrul de Stat al Unitatilor de Drept) service.
/// In production, this would call MConnect API.
/// </summary>
public class MockRsudService : IRsudService
{
    private static readonly List<BeneficiaryModel> MockCompanies =
    [
        new()
        {
            Id = Guid.Parse("a2000000-0000-0000-0000-000000000001"),
            Idno = "1003600012345",
            CompanyName = "SRL AgriSud",
            LegalForm = "SRL",
            ActivityType = "Agricultura",
            Address = "str. Stefan cel Mare 123",
            District = "Chisinau",
            Locality = "Chisinau",
        },
        new()
        {
            Id = Guid.Parse("a2000000-0000-0000-0000-000000000002"),
            Idno = "1003600012346",
            CompanyName = "SRL ConstructPlus",
            LegalForm = "SRL",
            ActivityType = "Constructii",
            Address = "str. Independentei 45",
            District = "Balti",
            Locality = "Balti",
        },
        new()
        {
            Id = Guid.Parse("a2000000-0000-0000-0000-000000000003"),
            Idno = "1003600012347",
            CompanyName = "II Gospodar",
            LegalForm = "II",
            ActivityType = "Agricultura",
            Address = "str. Libertati 78",
            District = "Cahul",
            Locality = "Cahul",
        },
    ];

    public Task<BeneficiaryModel?> GetCompanyByIdnoAsync(string idno)
    {
        var company = MockCompanies.FirstOrDefault(c => c.Idno == idno);
        return Task.FromResult(company);
    }

    public Task<List<BeneficiaryModel>> GetCompaniesByIdnpAsync(string idnp)
    {
        return Task.FromResult(MockCompanies.ToList());
    }
}
