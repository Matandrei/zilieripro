using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ezilier.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTagToVoucher : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Tag",
                table: "Vouchers",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Tag",
                table: "Vouchers");
        }
    }
}
