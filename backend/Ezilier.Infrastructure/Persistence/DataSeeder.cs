using Ezilier.Domain;
using Ezilier.Domain.Entities;
using Ezilier.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Ezilier.Infrastructure.Persistence;

public static class DataSeeder
{
    public static async Task SeedAsync(DataContext context)
    {
        if (await context.Roles.AnyAsync())
            return;

        // ── Roles ──
        var roleAngajator = new Role { Id = Guid.Parse("a1000000-0000-0000-0000-000000000001"), Key = Constants.Roles.Angajator, Title = "Angajator", Description = "Beneficiar - angajator de zilieri", Type = RoleType.Angajator };
        var roleInspector = new Role { Id = Guid.Parse("a1000000-0000-0000-0000-000000000002"), Key = Constants.Roles.Inspector, Title = "Inspector ISM", Description = "Inspectia de Stat a Muncii", Type = RoleType.Inspector };
        var roleAdmin = new Role { Id = Guid.Parse("a1000000-0000-0000-0000-000000000003"), Key = Constants.Roles.Administrator, Title = "Administrator", Description = "Administrator tehnic al sistemului", Type = RoleType.Administrator };
        var roleZilier = new Role { Id = Guid.Parse("a1000000-0000-0000-0000-000000000004"), Key = Constants.Roles.Zilier, Title = "Zilier", Description = "Lucrator zilier", Type = RoleType.Zilier };

        context.Roles.AddRange(roleAngajator, roleInspector, roleAdmin, roleZilier);

        // ── Permissions ──
        var permissions = new List<Permission>();
        void AddPerm(Role role, string key, string title) =>
            permissions.Add(new Permission { Key = key, Title = title, RoleId = role.Id });

        // Angajator permissions
        AddPerm(roleAngajator, Constants.Permissions.VouchersFull, "Gestionare completa vouchere");
        AddPerm(roleAngajator, Constants.Permissions.VouchersCreate, "Creare vouchere");
        AddPerm(roleAngajator, Constants.Permissions.VouchersView, "Vizualizare vouchere");
        AddPerm(roleAngajator, Constants.Permissions.VouchersEdit, "Editare vouchere");
        AddPerm(roleAngajator, Constants.Permissions.VouchersActivate, "Activare vouchere");
        AddPerm(roleAngajator, Constants.Permissions.VouchersExecute, "Executare vouchere");
        AddPerm(roleAngajator, Constants.Permissions.VouchersReport, "Raportare vouchere");
        AddPerm(roleAngajator, Constants.Permissions.VouchersCancel, "Anulare vouchere");
        AddPerm(roleAngajator, Constants.Permissions.WorkersFull, "Gestionare lucratori");
        AddPerm(roleAngajator, Constants.Permissions.ReportsView, "Vizualizare rapoarte");

        // Inspector permissions
        AddPerm(roleInspector, Constants.Permissions.VouchersView, "Vizualizare vouchere");
        AddPerm(roleInspector, Constants.Permissions.WorkersView, "Vizualizare lucratori");
        AddPerm(roleInspector, Constants.Permissions.ReportsView, "Vizualizare rapoarte");
        AddPerm(roleInspector, Constants.Permissions.CrossBeneficiaryView, "Vizualizare cross-beneficiar");

        // Admin permissions
        AddPerm(roleAdmin, Constants.Permissions.UsersFull, "Gestionare completa utilizatori");
        AddPerm(roleAdmin, Constants.Permissions.SystemParametersFull, "Gestionare parametri sistem");
        AddPerm(roleAdmin, Constants.Permissions.NomenclatorsFull, "Gestionare nomenclatoare");
        AddPerm(roleAdmin, Constants.Permissions.AuditView, "Vizualizare jurnal audit");
        AddPerm(roleAdmin, Constants.Permissions.ReportsFull, "Gestionare completa rapoarte");

        // Zilier permissions
        AddPerm(roleZilier, Constants.Permissions.VouchersView, "Vizualizare vouchere proprii");

        context.Permissions.AddRange(permissions);

        // ── Beneficiaries ──
        var ben1 = new Beneficiary { Id = Guid.Parse("b1000000-0000-0000-0000-000000000001"), Idno = "1003600012345", CompanyName = "SRL AgriSud", LegalForm = "SRL", ActivityType = "Agricultura", Address = "str. Stefan cel Mare 123", District = "Chisinau", Locality = "Chisinau" };
        var ben2 = new Beneficiary { Id = Guid.Parse("b1000000-0000-0000-0000-000000000002"), Idno = "1003600012346", CompanyName = "SRL ConstructPlus", LegalForm = "SRL", ActivityType = "Constructii", Address = "str. Independentei 45", District = "Balti", Locality = "Balti" };

        context.Beneficiaries.AddRange(ben1, ben2);

        // ── Users ──
        var passwordHash = BCrypt.Net.BCrypt.HashPassword("parola123");

        // Employer user
        var userEmp = new User { Id = Guid.Parse("c1000000-0000-0000-0000-000000000001"), Idnp = "2003400111111", FirstName = "Ion", LastName = "Popescu", Email = "ion.popescu@test.md", Phone = "+37360123456" };
        var identEmp = new UserIdentity { UserId = userEmp.Id, RoleId = roleAngajator.Id, BeneficiaryId = ben1.Id, PasswordHash = passwordHash, Status = UserStatus.Active };
        context.Users.Add(userEmp);
        context.UserIdentities.Add(identEmp);

        // Inspector user
        var userIns = new User { Id = Guid.Parse("c1000000-0000-0000-0000-000000000002"), Idnp = "2003400222222", FirstName = "Maria", LastName = "Ionescu", Email = "maria.ionescu@ism.gov.md", Phone = "+37360123457" };
        var identIns = new UserIdentity { UserId = userIns.Id, RoleId = roleInspector.Id, PasswordHash = passwordHash, Status = UserStatus.Active, AssignedDistricts = "Chisinau,Balti,Cahul,Orhei" };
        context.Users.Add(userIns);
        context.UserIdentities.Add(identIns);

        // Admin user
        var userAdm = new User { Id = Guid.Parse("c1000000-0000-0000-0000-000000000003"), Idnp = "2003400333333", FirstName = "Vasile", LastName = "Rusu", Email = "vasile.rusu@admin.gov.md", Phone = "+37360123458" };
        var identAdm = new UserIdentity { UserId = userAdm.Id, RoleId = roleAdmin.Id, PasswordHash = passwordHash, Status = UserStatus.Active };
        context.Users.Add(userAdm);
        context.UserIdentities.Add(identAdm);

        // Zilier user
        var userZil = new User { Id = Guid.Parse("c1000000-0000-0000-0000-000000000004"), Idnp = "2003400444444", FirstName = "Elena", LastName = "Moraru", Email = "elena.moraru@test.md", Phone = "+37360123459" };
        var identZil = new UserIdentity { UserId = userZil.Id, RoleId = roleZilier.Id, PasswordHash = passwordHash, Status = UserStatus.Active };
        context.Users.Add(userZil);
        context.UserIdentities.Add(identZil);

        // ── Workers ──
        var worker1 = new Worker { Id = Guid.Parse("d1000000-0000-0000-0000-000000000001"), Idnp = "2003400444444", FirstName = "Elena", LastName = "Moraru", BirthDate = new DateOnly(1995, 1, 30), Phone = "+37360123459", Email = "elena.moraru@test.md", BeneficiaryId = ben1.Id, RspValidated = true, RspValidatedAt = DateTimeOffset.UtcNow };
        var worker2 = new Worker { Id = Guid.Parse("d1000000-0000-0000-0000-000000000002"), Idnp = "2003400555555", FirstName = "Andrei", LastName = "Cojocaru", BirthDate = new DateOnly(1988, 6, 12), Phone = "+37360123460", BeneficiaryId = ben1.Id, RspValidated = true, RspValidatedAt = DateTimeOffset.UtcNow };
        var worker3 = new Worker { Id = Guid.Parse("d1000000-0000-0000-0000-000000000003"), Idnp = "2003400666666", FirstName = "Ana", LastName = "Lungu", BirthDate = new DateOnly(2000, 9, 18), Phone = "+37360123461", BeneficiaryId = ben1.Id, RspValidated = true, RspValidatedAt = DateTimeOffset.UtcNow };

        context.Workers.AddRange(worker1, worker2, worker3);

        // ── Demo Vouchers ──
        var taxService = new Application.Services.TaxCalculationService();

        void AddVoucher(Worker w, DateOnly date, int hours, decimal net, VoucherStatus status, Beneficiary ben)
        {
            var (tax, cnas, gross) = taxService.Calculate(net);
            var v = new Voucher
            {
                Code = $"VCH-{Guid.NewGuid().ToString("N")[..8].ToUpper()}",
                BeneficiaryId = ben.Id,
                WorkerId = w.Id,
                Status = status,
                WorkDate = date,
                HoursWorked = hours,
                NetRemuneration = net,
                IncomeTax = tax,
                CnasContribution = cnas,
                GrossRemuneration = gross,
                WorkDistrict = ben.District ?? "Chisinau",
                WorkLocality = ben.Locality ?? "Chisinau",
                WorkAddress = ben.Address,
                RspValidated = true,
                Art5Alin1LitB = true,
                Art5Alin1LitG = true,
                CreatedBy = userEmp.Id
            };
            if (status >= VoucherStatus.Activ) v.ActivatedAt = DateTimeOffset.UtcNow.AddDays(-2);
            if (status >= VoucherStatus.Executat) v.ExecutedAt = DateTimeOffset.UtcNow.AddDays(-1);
            if (status >= VoucherStatus.Raportat) { v.ReportedAt = DateTimeOffset.UtcNow; v.ReportPeriod = date.ToString("yyyy-MM"); }
            context.Vouchers.Add(v);
        }

        AddVoucher(worker1, new DateOnly(2026, 4, 1), 8, 250, VoucherStatus.Raportat, ben1);
        AddVoucher(worker1, new DateOnly(2026, 4, 2), 8, 250, VoucherStatus.Executat, ben1);
        AddVoucher(worker1, new DateOnly(2026, 4, 3), 6, 200, VoucherStatus.Activ, ben1);
        AddVoucher(worker2, new DateOnly(2026, 4, 1), 8, 300, VoucherStatus.Raportat, ben1);
        AddVoucher(worker2, new DateOnly(2026, 4, 2), 8, 300, VoucherStatus.Activ, ben1);
        AddVoucher(worker3, new DateOnly(2026, 4, 1), 5, 150, VoucherStatus.Emis, ben1);
        AddVoucher(worker3, new DateOnly(2026, 4, 3), 7, 200, VoucherStatus.Emis, ben1);

        // ── System Parameters ──
        context.SystemParameters.AddRange(
            new SystemParameter { Key = Constants.SystemParams.YearlyWorkerVoucherLimit, Value = "120", Description = "Limita anuala de vouchere per lucrator per beneficiar", ValueType = "int" },
            new SystemParameter { Key = Constants.SystemParams.IncomeTaxRate, Value = "0.12", Description = "Rata impozitului pe venit (12%)", ValueType = "decimal" },
            new SystemParameter { Key = Constants.SystemParams.CnasRate, Value = "0.06", Description = "Rata contributiei CNAS (6%)", ValueType = "decimal" },
            new SystemParameter { Key = Constants.SystemParams.MinimumSalary, Value = "100", Description = "Salariul minim zilnic (MDL)", ValueType = "decimal" }
        );

        // ── Nomenclators ──
        context.Nomenclators.AddRange(
            // Cancellation reasons
            new Nomenclator { Category = Constants.NomenclatorCategories.CancellationReasons, Code = "CA-01", TitleRo = "Renuntare din partea angajatorului", TitleRu = "Отказ работодателя", TitleEn = "Employer withdrawal", SortOrder = 1 },
            new Nomenclator { Category = Constants.NomenclatorCategories.CancellationReasons, Code = "CA-02", TitleRo = "Renuntare din partea zilierului", TitleRu = "Отказ работника", TitleEn = "Worker withdrawal", SortOrder = 2 },
            new Nomenclator { Category = Constants.NomenclatorCategories.CancellationReasons, Code = "CA-03", TitleRo = "Eroare la emitere", TitleRu = "Ошибка выдачи", TitleEn = "Issuance error", SortOrder = 3 },

            // Districts
            new Nomenclator { Category = Constants.NomenclatorCategories.Districts, Code = "CHI", TitleRo = "Chisinau", TitleRu = "Кишинёв", TitleEn = "Chisinau", SortOrder = 1 },
            new Nomenclator { Category = Constants.NomenclatorCategories.Districts, Code = "BAL", TitleRo = "Balti", TitleRu = "Бельцы", TitleEn = "Balti", SortOrder = 2 },
            new Nomenclator { Category = Constants.NomenclatorCategories.Districts, Code = "CAH", TitleRo = "Cahul", TitleRu = "Кагул", TitleEn = "Cahul", SortOrder = 3 },
            new Nomenclator { Category = Constants.NomenclatorCategories.Districts, Code = "ORH", TitleRo = "Orhei", TitleRu = "Орхей", TitleEn = "Orhei", SortOrder = 4 },
            new Nomenclator { Category = Constants.NomenclatorCategories.Districts, Code = "UNG", TitleRo = "Ungheni", TitleRu = "Унгены", TitleEn = "Ungheni", SortOrder = 5 },
            new Nomenclator { Category = Constants.NomenclatorCategories.Districts, Code = "SOR", TitleRo = "Soroca", TitleRu = "Сорока", TitleEn = "Soroca", SortOrder = 6 },

            // Activity types
            new Nomenclator { Category = Constants.NomenclatorCategories.ActivityTypes, Code = "AGR", TitleRo = "Agricultura", TitleRu = "Сельское хозяйство", TitleEn = "Agriculture", SortOrder = 1 },
            new Nomenclator { Category = Constants.NomenclatorCategories.ActivityTypes, Code = "CON", TitleRo = "Constructii", TitleRu = "Строительство", TitleEn = "Construction", SortOrder = 2 },
            new Nomenclator { Category = Constants.NomenclatorCategories.ActivityTypes, Code = "COM", TitleRo = "Comert", TitleRu = "Торговля", TitleEn = "Commerce", SortOrder = 3 },
            new Nomenclator { Category = Constants.NomenclatorCategories.ActivityTypes, Code = "SER", TitleRo = "Servicii", TitleRu = "Услуги", TitleEn = "Services", SortOrder = 4 },

            // Legal forms
            new Nomenclator { Category = Constants.NomenclatorCategories.LegalForms, Code = "SRL", TitleRo = "Societate cu raspundere limitata", TitleRu = "ООО", TitleEn = "LLC", SortOrder = 1 },
            new Nomenclator { Category = Constants.NomenclatorCategories.LegalForms, Code = "SA", TitleRo = "Societate pe actiuni", TitleRu = "АО", TitleEn = "JSC", SortOrder = 2 },
            new Nomenclator { Category = Constants.NomenclatorCategories.LegalForms, Code = "II", TitleRo = "Intreprindere individuala", TitleRu = "ИП", TitleEn = "Sole proprietorship", SortOrder = 3 },
            new Nomenclator { Category = Constants.NomenclatorCategories.LegalForms, Code = "GC", TitleRo = "Gospodarie taraneasca", TitleRu = "КХ", TitleEn = "Farm household", SortOrder = 4 }
        );

        await context.SaveChangesAsync();
    }
}
