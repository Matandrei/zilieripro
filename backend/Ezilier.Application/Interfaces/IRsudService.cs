using Ezilier.Application.Models;

namespace Ezilier.Application.Interfaces;

public interface IRsudService
{
    Task<BeneficiaryModel?> GetCompanyByIdnoAsync(string idno);
    Task<List<BeneficiaryModel>> GetCompaniesByIdnpAsync(string idnp);
}
