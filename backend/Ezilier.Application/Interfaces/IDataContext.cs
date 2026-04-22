using Ezilier.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Ezilier.Application.Interfaces;

public interface IDataContext
{
    DbSet<Voucher> Vouchers { get; }
    DbSet<Worker> Workers { get; }
    DbSet<Beneficiary> Beneficiaries { get; }
    DbSet<User> Users { get; }
    DbSet<UserIdentity> UserIdentities { get; }
    DbSet<Role> Roles { get; }
    DbSet<Permission> Permissions { get; }
    DbSet<UserPermission> UserPermissions { get; }
    DbSet<Nomenclator> Nomenclators { get; }
    DbSet<SystemParameter> SystemParameters { get; }
    DbSet<AuditLog> AuditLogs { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
