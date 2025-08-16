# CFX Portal Upload Action

A GitHub Action to automatically upload files to CFX.re Portal.

## Features

- 🚀 Automated file uploads to CFX.re Portal
- 🔒 Secure authentication using tokens
- 📦 Built with TypeScript and Bun runtime
- ⚡ Fast and reliable uploads
- 🗜️ Automatic zip creation from specified files/folders**
- 🏗️ Composite action - no pre-compilation needed

## Usage

### Basic Usage

To use this action in your workflow, add the following step:

```yaml
- name: Upload to CFX Portal
  uses: HeyyCzer/actions-cfxportal@beta
  with:
    portal-token: ${{ secrets.PORTAL_TOKEN }}
    asset-id: '12345'
    asset-name: 'my-asset-name'
    file-path: './dist/my-file.zip'
```

### Using Automatic Zip Creation

You can enable automatic zip creation to package specific files/folders:

#### Method 1: YAML Array Format
```yaml
- name: Upload to CFX Portal with Zip
  uses: HeyyCzer/actions-cfxportal@beta
  with:
    portal-token: ${{ secrets.PORTAL_TOKEN }}
    asset-id: '12345'
    asset-name: 'my-asset-name'
    file-path: './dist/output.zip'  # This will be ignored when zip is enabled
    zip-enabled: 'true'
    zip-files: '[src/, dist/main.js, README.md, package.json]'
    zip-output-path: './dist/my-project.zip'
```

#### Method 2: Multiline YAML List
```yaml
- name: Upload to CFX Portal with Zip
  uses: HeyyCzer/actions-cfxportal@beta
  with:
    portal-token: ${{ secrets.PORTAL_TOKEN }}
    asset-id: '12345'
    asset-name: 'my-asset-name'
    file-path: './dist/output.zip'
    zip-enabled: 'true'
    zip-files: |
      - src/
      - dist/main.js
      - README.md
      - package.json
    zip-output-path: './dist/my-project.zip'
```

#### Method 3: Simple Multiline
```yaml
- name: Upload to CFX Portal with Zip
  uses: HeyyCzer/actions-cfxportal@beta
  with:
    portal-token: ${{ secrets.PORTAL_TOKEN }}
    asset-id: '12345'
    asset-name: 'my-asset-name'
    file-path: './dist/output.zip'
    zip-enabled: 'true'
    zip-files: |
      src/
      dist/main.js
      README.md
      package.json
    zip-output-path: './dist/my-project.zip'
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `portal-token` | CFX Portal authentication token | ✅ | - |
| `asset-id` | ID of the asset to upload to | ✅ | - |
| `asset-name` | Name of the asset | ✅ | - |
| `file-path` | Path to the file to upload | ✅ | - |
| `zip-enabled` | Enable zip creation (true/false) | ❌ | `false` |
| `zip-files` | YAML array of files/folders to include in zip | ❌ | - |
| `zip-output-path` | Output path for the zip file | ❌ | `./dist/output.zip` |
| `zip-enabled` | Enable automatic zip creation | ❌ | `false` |
| `zip-files` | Comma-separated list of files/folders to include in zip | ❌ | - |
| `zip-output-path` | Output path for the created zip file | ❌ | `./dist/output.zip` |

### Zip Creation Details

When `zip-enabled` is set to `true`:
- The action will create a zip file containing only the specified files/folders in `zip-files`
- All other files in your repository will be ignored
- The created zip file will be uploaded instead of the file specified in `file-path`
- Supports both individual files and entire directories
- Uses maximum compression for optimal file size

## Zip Files Configuration

The `zip-files` input supports multiple formats for flexibility:

### 1. YAML Array Format (Recommended)
```yaml
zip-files: '[src/, dist/main.js, README.md, package.json]'
```

### 2. YAML List Format (Multiline)
```yaml
zip-files: |
  - src/
  - dist/main.js
  - README.md
  - package.json
```

### 3. Simple Multiline Format
```yaml
zip-files: |
  src/
  dist/main.js
  README.md
  package.json
```

All formats will result in the same files being included in the zip archive.

## Setting up Secrets

You'll need to add the following secret to your repository:

1. Go to your repository settings
2. Navigate to "Secrets and variables" → "Actions"
3. Add a new secret named `PORTAL_TOKEN` with your CFX.re portal token

## Example Workflow

Here's a complete example workflow that builds your project and uploads it to CFX Portal:

### Example 1: Upload existing zip file

```yaml
name: Deploy to CFX Portal

on:
  push:
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
      uses: HeyyCzer/actions-cfxportal@beta
      with:
        portal-token: ${{ secrets.PORTAL_TOKEN }}
        asset-id: '12345'
        asset-name: 'my-project'
        file-path: './my-project.zip'
```

### Example 2: Automatic zip creation

```yaml
name: Deploy to CFX Portal with Auto-Zip

on:
  push:
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
    
    - name: Upload to CFX Portal
      uses: HeyyCzer/actions-cfxportal@beta
      with:
        portal-token: ${{ secrets.PORTAL_TOKEN }}
        asset-id: '12345'
        asset-name: 'my-project'
        file-path: './not-used-when-zip-enabled.zip'
        zip-enabled: 'true'
        zip-files: |
          - dist/
          - package.json
          - README.md
          - LICENSE
        zip-output-path: './release/my-project.zip'
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

# Optional: Enable zip creation
export ZIP_ENABLED="true"
export ZIP_FILES="[src/, package.json, README.md]"
export ZIP_OUTPUT_PATH="./dist/output.zip"

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
