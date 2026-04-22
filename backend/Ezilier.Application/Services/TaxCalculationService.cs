namespace Ezilier.Application.Services;

public interface ITaxCalculationService
{
    (decimal incomeTax, decimal cnas, decimal gross) Calculate(decimal netRemuneration);
}

public class TaxCalculationService : ITaxCalculationService
{
    private const decimal IncomeTaxRate = 0.12m;
    private const decimal CnasRate = 0.06m;

    public (decimal incomeTax, decimal cnas, decimal gross) Calculate(decimal netRemuneration)
    {
        var incomeTax = Math.Round(netRemuneration * IncomeTaxRate, 2);
        var cnas = Math.Round(netRemuneration * CnasRate, 2);
        var gross = netRemuneration + incomeTax + cnas;
        return (incomeTax, cnas, gross);
    }
}
