dotnet publish "src/src.csproj" --configuration Release --runtime linux-x64 --self-contained false --output ./app/publish -p:GenerateRuntimeConfigurationFiles=true
pause