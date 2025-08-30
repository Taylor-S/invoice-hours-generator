# Billdu API Configuration

## Setting up API Credentials

To use the Billdu API integration, you need to configure your API credentials:

### Option 1: Environment Files (Recommended for Development)

1. Copy the example file:
   ```bash
   cp src/environments/environment.local.example.ts src/environments/environment.local.ts
   ```

2. Edit `src/environments/environment.local.ts` and add your actual credentials:
   ```typescript
   export const environment = {
     production: false,
     billdu: {
       apiKey: 'your_actual_api_key_here',
       apiSecret: 'your_actual_api_secret_here',
       baseUrl: 'https://api.billdu.com'
     }
   };
   ```

3. Update `angular.json` to use the local environment file during development (optional).

### Option 2: Direct Environment Configuration

Edit the appropriate environment file:
- Development: `src/environments/environment.ts`
- Production: `src/environments/environment.prod.ts`

Add your credentials:
```typescript
export const environment = {
  production: false, // or true for prod
  billdu: {
    apiKey: 'your_api_key',
    apiSecret: 'your_api_secret', 
    baseUrl: 'https://api.billdu.com'
  }
};
```

### Option 3: Runtime Configuration

You can also set credentials programmatically:

```typescript
// In your component or service
this.billduApiService.setApiCredentials('your_api_key', 'your_api_secret');
```

## Getting Billdu API Credentials

1. Log in to your Billdu account
2. Go to Settings > API
3. Generate your API Key and API Secret
4. Copy the credentials to your environment configuration

## Security Notes

- **Never commit API credentials to version control**
- The `.gitignore` file is configured to exclude:
  - `.env*` files
  - `environment.*.ts` files (except the base ones)
- Use environment variables in production deployments
- Consider using Angular's production build configurations for secure credential management

## Testing the Integration

The service will log a warning if credentials are not configured. Check the browser console for any configuration issues.
