using Microsoft.EntityFrameworkCore;

namespace src.EFCore.DBContext
{
    public class ReadDBContext : DbContext
    {
        public ReadDBContext()
        {

        }
        public ReadDBContext(DbContextOptions<ReadDBContext> options) : base(options)
        {
        }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {

        }


        protected override void OnModelCreating(ModelBuilder builder)
        {
            var entity = builder.Entity<CustomerModel>();

            entity.ToTable("Customer_Model");
            entity.HasData(
                new CustomerModel() { Id = 1, Name = "Janeman" },
                new CustomerModel() { Id = 2, Name = "Miles" },
                new CustomerModel() { Id = 3, Name = "Milan" }
            );

            base.OnModelCreating(builder);
        }


        public virtual DbSet<CustomerModel> Customers { get; set; }
    }
}