using Ezilier.Application.Models;

namespace Ezilier.Application.Interfaces;

public interface IIpc21PdfGenerator
{
    byte[] Generate(Ipc21ReportModel model);
}
