using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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
        Console.WriteLine("[README] Controller is constructed");
        this.readDBContext = readDBContext;
        _logger = logger;
    }

    [HttpGet]
    [Route("Explicitly-Close-Connection")]
    public async Task<IActionResult> ExpliciteClose()
    {
        Console.WriteLine("[README] Controller is being Run");
        var customers = readDBContext.Customers;
        Console.WriteLine("[README] Data has been Accessed from the database");
        readDBContext.Database.CloseConnection();
        Console.WriteLine("[README] Database connection is closed");
        return Ok(customers);
    }

    [HttpGet]
    [Route("Implicitly-Close-Connection")]
    public async Task<IActionResult> ImpliciteClose()
    {
        Console.WriteLine("[README] Controller is being Run");
        var customers = readDBContext.Customers;
        Console.WriteLine("[README] Data has been Accessed from the database");
        return Ok(customers);
    }
}
