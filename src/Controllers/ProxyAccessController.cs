using Microsoft.AspNetCore.Mvc;
using src.EFCore;
using src.EFCore.DBContext;

namespace src.Controllers;

[ApiController]
[Route("[controller]")]
public class ProxyAccessController : ControllerBase
{
    private readonly ILogger<ProxyAccessController> _logger;
    private readonly ReadDBContext readDBContext;

    public ProxyAccessController(ILogger<ProxyAccessController> logger, ReadDBContext readDBContext)
    {
        this.readDBContext = readDBContext;
        _logger = logger;
    }

    [HttpGet(Name = "GetDefaultValues")]
    public IEnumerable<CustomerModel> Get()
    {
        var customers = readDBContext.Customers;
        return customers;
    }
}
