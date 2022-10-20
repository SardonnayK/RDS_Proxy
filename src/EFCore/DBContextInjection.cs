using Amazon;
using Amazon.SecretsManager;
using Amazon.SecretsManager.Model;
using Amazon.XRay.Recorder.Core;
using Amazon.XRay.Recorder.Handlers.AwsSdk;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using src.EFCore.Configurations.Models;
using src.EFCore.DBContext;

namespace src.EFCore;

public static class DBContextInjection
{
    public static IServiceCollection AddReadDBContext(this IServiceCollection services, IConfiguration configuration)
    {
        var DATABASE_NAME = configuration.GetValue<string>("DATABASE_NAME");
        var DB_HOST = Environment.GetEnvironmentVariable("DB_HOSTNAME");

        if (configuration.GetValue<bool>("UseInMemoryDatabase"))
        {
            var connectionString = configuration.GetConnectionString("DefaultConnection");
            services.AddDbContext<ReadDBContext>(options =>
                options.UseLazyLoadingProxies().UseMySql(
                    connectionString,
                    ServerVersion.AutoDetect(connectionString),
                    x => x.UseNetTopologySuite().EnableRetryOnFailure(2)
                   ));

            using (var sp = services.BuildServiceProvider())
            using (var readDBContext = sp.GetService<ReadDBContext>())
                readDBContext?.Database.EnsureCreated();
        }
        else
        {
            //TODO: Figure out how to retrieve from correct region dynamically.
            var config = new AmazonSecretsManagerConfig { RegionEndpoint = RegionEndpoint.EUCentral1 };
            var client = new AmazonSecretsManagerClient(config);
            var secretName = Environment.GetEnvironmentVariable("SECRET_NAME") ?? "dev";

            var request = new GetSecretValueRequest
            {

                SecretId = secretName
            };

            GetSecretValueResponse response = null;

            response = client.GetSecretValueAsync(request).GetAwaiter().GetResult();
            var secret = JsonConvert.DeserializeObject<SecretManager>(response.SecretString);
            var connectionString = secret.connectionString(DB_HOST);

            services.AddDbContext<ReadDBContext>(options =>
            {
                Console.WriteLine("[README] Run before connection is established");
                options.UseLazyLoadingProxies().UseMySql(
                    connectionString,
                    ServerVersion.AutoDetect(connectionString),
                    x => x.UseNetTopologySuite().EnableRetryOnFailure(2)
                   ).EnableSensitiveDataLogging();
                Console.WriteLine("[README] Run After connection is established");
            });

            if (AWSXRayRecorder.IsLambda())
            {
                AWSSDKHandler.RegisterXRayForAllServices();
            }
            using (var sp = services.BuildServiceProvider())
            using (var readDBContext = sp.GetService<ReadDBContext>())
                readDBContext?.Database.EnsureCreated();
        }


        return services;
    }

}

