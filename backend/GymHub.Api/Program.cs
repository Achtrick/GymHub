using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Bson.Serialization.Conventions;
using MongoDB.Driver;

ConventionRegistry.Register(
    "camelCase",
    new ConventionPack { new CamelCaseElementNameConvention() },
    _ => true);

var builder = WebApplication.CreateBuilder(args);

// Configure CORS
var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>() ?? Array.Empty<string>();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.Configure<MongoDbSettings>(
    builder.Configuration.GetSection("MongoDb"));
builder.Services.AddSingleton<IMongoDatabase>(sp =>
{
    var settings = sp.GetRequiredService<IOptions<MongoDbSettings>>().Value;
    var client = new MongoClient(settings.ConnectionString);
    return client.GetDatabase(settings.DatabaseName);
});

// Auth
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("Jwt"));
builder.Services.Configure<GoogleAuthSettings>(builder.Configuration.GetSection("Google"));
builder.Services.AddSingleton<TokenService>();

// PR submissions (feed / leaderboard)
var uploadsDirectory = Path.Combine(builder.Environment.ContentRootPath, "uploads");
builder.Services.AddSingleton(new UploadSettings { Directory = uploadsDirectory });
builder.Services.AddSingleton<PrSubmissionService>();
builder.Services.AddSingleton<WeightEntryService>();
builder.Services.AddSingleton<CardPricingService>();
builder.Services.Configure<StripeSettings>(builder.Configuration.GetSection("Stripe"));
builder.Services.AddSingleton<NotificationService>();
builder.Services.Configure<EmailSettings>(builder.Configuration.GetSection("Email"));
builder.Services.AddSingleton<EmailService>();
builder.Services.Configure<AppSettings>(builder.Configuration.GetSection("App"));

var jwtSettings = builder.Configuration.GetSection("Jwt").Get<JwtSettings>()
    ?? throw new InvalidOperationException("Jwt configuration section is missing.");

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtSettings.Issuer,
            ValidateAudience = true,
            ValidAudience = jwtSettings.Audience,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Secret)),
        };
    });

builder.Services.AddAuthorization();

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

Stripe.StripeConfiguration.ApiKey =
    app.Services.GetRequiredService<IOptions<StripeSettings>>().Value.SecretKey;

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI(c =>
 {
     c.SwaggerEndpoint("/swagger/v1/swagger.json", "GymHub API v1");
     c.RoutePrefix = string.Empty; // serves the UI at "/" instead of "/swagger"
 });
}

app.UseHttpsRedirection();

app.UseCors("AllowReactApp");

app.UseAuthentication();
app.UseAuthorization();

Directory.CreateDirectory(uploadsDirectory);
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(uploadsDirectory),
    RequestPath = "/uploads",
});

app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var database = scope.ServiceProvider.GetRequiredService<IMongoDatabase>();

    var users = database.GetCollection<User>("users");
    await users.Indexes.CreateManyAsync(new[]
    {
        new CreateIndexModel<User>(
            Builders<User>.IndexKeys.Ascending(u => u.Email),
            new CreateIndexOptions { Unique = true }),
        new CreateIndexModel<User>(
            Builders<User>.IndexKeys.Ascending(u => u.GoogleId),
            new CreateIndexOptions { Unique = true, Sparse = true }),
    });

    var prSubmissions = database.GetCollection<PrSubmission>("prSubmissions");
    await prSubmissions.Indexes.CreateManyAsync(new[]
    {
        new CreateIndexModel<PrSubmission>(
            Builders<PrSubmission>.IndexKeys.Ascending(p => p.Status).Descending(p => p.CreatedAt)),
        new CreateIndexModel<PrSubmission>(
            Builders<PrSubmission>.IndexKeys.Ascending(p => p.UserId)),
    });

    var comments = database.GetCollection<Comment>("comments");
    await comments.Indexes.CreateOneAsync(
        new CreateIndexModel<Comment>(Builders<Comment>.IndexKeys.Ascending(c => c.PrSubmissionId)));

    var weightEntries = database.GetCollection<WeightEntry>("weightEntries");
    await weightEntries.Indexes.CreateManyAsync(new[]
    {
        new CreateIndexModel<WeightEntry>(
            Builders<WeightEntry>.IndexKeys.Ascending(e => e.Status).Descending(e => e.CreatedAt)),
        new CreateIndexModel<WeightEntry>(
            Builders<WeightEntry>.IndexKeys.Ascending(e => e.UserId)),
    });

    var badges = database.GetCollection<Badge>("badges");
    await badges.Indexes.CreateOneAsync(
        new CreateIndexModel<Badge>(
            Builders<Badge>.IndexKeys.Ascending(b => b.UserId).Ascending(b => b.LiftType).Ascending(b => b.Tier),
            new CreateIndexOptions { Unique = true }));

    var notifications = database.GetCollection<Notification>("notifications");
    await notifications.Indexes.CreateOneAsync(
        new CreateIndexModel<Notification>(
            Builders<Notification>.IndexKeys.Ascending(n => n.UserId).Descending(n => n.CreatedAt)));
}

app.Run();
