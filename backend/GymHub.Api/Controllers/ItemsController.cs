using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;

[ApiController]
[Route("api/[controller]")]
public class ItemsController : ControllerBase
{
    private readonly IMongoCollection<Item> _items;

    public ItemsController(IMongoDatabase database)
    {
        _items = database.GetCollection<Item>("items");
    }

    [HttpGet]
    public async Task<List<Item>> Get() =>
        await _items.Find(_ => true).ToListAsync();

    [HttpPost]
    public async Task<IActionResult> Post(Item item)
    {
        await _items.InsertOneAsync(item);
        return Ok(item);
    }
}