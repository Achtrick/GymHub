# ---- Build stage ----
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy only the csproj first (better layer caching — deps only reinstall if csproj changes)
COPY GymHub.Api/GymHub.Api.csproj GymHub.Api/
RUN dotnet restore GymHub.Api/GymHub.Api.csproj

# Now copy the rest of the source
COPY GymHub.Api/ GymHub.Api/
WORKDIR /src/GymHub.Api
RUN dotnet publish -c Release -o /app/publish

# ---- Dev stage ----
# Used by docker-compose.override.yml (target: dev) so `dotnet watch` runs
# against the live bind-mounted source instead of this stage's own COPY'd
# snapshot. The SDK base image has no ENTRYPOINT, so compose's `command:`
# becomes the container's actual process (unlike the runtime stage below,
# whose baked-in ENTRYPOINT would otherwise just swallow it as extra args).
FROM build AS dev
WORKDIR /src

# ---- Runtime stage ----
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

EXPOSE 8080
ENTRYPOINT ["dotnet", "GymHub.Api.dll"]