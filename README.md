# CFX Portal Upload Action

A GitHub Action to automatically upload files to CFX.re Portal.

## Features

- 🚀 Automated file uploads to CFX.re Portal
- 🔒 Secure authentication using tokens
- 📦 Built with TypeScript and Bun runtime
- ⚡ Fast and reliable uploads
- 🏗️ Composite action - no pre-compilation needed

## Usage

To use this action in your workflow, add the following step:

```yaml
- name: Upload to CFX Portal
  uses: your-username/actions-cfxportal@v1
  with:
    portal-token: ${{ secrets.CFX_PORTAL_TOKEN }}
    asset-id: '12345'
    asset-name: 'my-asset-name'
    file-path: './dist/my-file.zip'
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `portal-token` | CFX Portal authentication token | ✅ | - |
| `asset-id` | ID of the asset to upload to | ✅ | - |
| `asset-name` | Name of the asset | ✅ | - |
| `file-path` | Path to the file to upload | ✅ | - |

## Setting up Secrets

You'll need to add the following secret to your repository:

1. Go to your repository settings
2. Navigate to "Secrets and variables" → "Actions"
3. Add a new secret named `CFX_PORTAL_TOKEN` with your CFX.re portal token

## Example Workflow

Here's a complete example workflow that builds your project and uploads it to CFX Portal:

```yaml
name: Deploy to CFX Portal

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
    
    - name: Install dependencies
      run: npm install
    
    - name: Build project
      run: npm run build
    
    - name: Create zip file
      run: zip -r my-project.zip dist/
    
    - name: Upload to CFX Portal
      uses: your-username/actions-cfxportal@v1
      with:
        portal-token: ${{ secrets.CFX_PORTAL_TOKEN }}
        asset-id: '12345'
        asset-name: 'my-project'
        file-path: './my-project.zip'
```

## Requirements

- Bun runtime (automatically installed by the action)
- Valid CFX.re Portal account and token
- Asset must already exist on CFX Portal

## Development

To work on this action locally:

```bash
# Install dependencies
bun install

# Run in development mode (set env vars first)
export PORTAL_TOKEN="your-token"
export PORTAL_ASSET_ID="12345"
export PORTAL_ASSET_NAME="your-asset"
export FILE_TO_UPLOAD="./test-files/cfxportal-test.zip"
bun run dev
```

## License

MIT

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
