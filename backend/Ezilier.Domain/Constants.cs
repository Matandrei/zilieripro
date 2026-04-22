namespace Ezilier.Domain;

public static class Constants
{
    public static class Roles
    {
        public const string Angajator = "angajator";
        public const string Inspector = "inspector";
        public const string Administrator = "administrator";
        public const string Zilier = "zilier";
    }

    public static class Permissions
    {
        // Vouchers
        public const string VouchersFull = "vouchers:full";
        public const string VouchersView = "vouchers:view";
        public const string VouchersCreate = "vouchers:create";
        public const string VouchersEdit = "vouchers:edit";
        public const string VouchersActivate = "vouchers:activate";
        public const string VouchersExecute = "vouchers:execute";
        public const string VouchersReport = "vouchers:report";
        public const string VouchersCancel = "vouchers:cancel";

        // Workers
        public const string WorkersFull = "workers:full";
        public const string WorkersView = "workers:view";
        public const string WorkersCreate = "workers:create";
        public const string WorkersEdit = "workers:edit";

        // Users
        public const string UsersFull = "users:full";
        public const string UsersView = "users:view";
        public const string UsersCreate = "users:create";
        public const string UsersEdit = "users:edit";
        public const string UsersChangeStatus = "users:change_status";

        // Reports
        public const string ReportsFull = "reports:full";
        public const string ReportsView = "reports:view";

        // System
        public const string SystemParametersFull = "system_params:full";
        public const string NomenclatorsFull = "nomenclators:full";
        public const string AuditView = "audit:view";

        // Inspector cross-beneficiary
        public const string CrossBeneficiaryView = "cross_beneficiary:view";
    }

    public static class SystemParams
    {
        public const string YearlyWorkerVoucherLimit = "yearly_worker_voucher_limit";
        public const string IncomeTaxRate = "income_tax_rate";
        public const string CnasRate = "cnas_rate";
        public const string MinimumSalary = "minimum_salary";
    }

    public static class NomenclatorCategories
    {
        public const string CancellationReasons = "cancellation_reasons";
        public const string Districts = "districts";
        public const string ActivityTypes = "activity_types";
        public const string LegalForms = "legal_forms";
    }
}
