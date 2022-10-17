namespace src.EFCore.Configurations.Models
{
    public class SecretManager
    {
        public string password { get; set; }
        public string host { get; set; }
        public string username { get; set; }
        public string dbname { get; set; }
        public int? port { get; set; }

        public string connectionString(string host = null)
        {
            host ??= this.host;
            var connectionString = $"Server={this.host};Database= {dbname};Uid= {username};Pwd= {password};";
            Console.WriteLine("[README] Connection string is: {0}", connectionString);
            return connectionString;
        }
    }

}