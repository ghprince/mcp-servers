# Google Cloud Logging MCP Server

A Model Context Protocol (MCP) server that provides a tool for reading Google Cloud logs using the `gcloud logging read` CLI command. This server enables Cursor editor and other MCP clients to interact with Google Cloud Logging services.

## Features

This MCP server provides one focused tool:

- **gcloud_logging_read**: Read log entries using the `gcloud logging read` command with comprehensive filtering and formatting options

### Key Improvements
- **Proper shell escaping**: Uses `spawn` instead of `exec` to properly handle complex filters with special characters, quotes, and timestamps
- **Robust argument handling**: All parameters are passed as separate arguments to avoid shell parsing issues

## Prerequisites

1. **Google Cloud SDK**: Install and configure the `gcloud` CLI
   ```bash
   # Install gcloud CLI (if not already installed)
   # Follow instructions at: https://cloud.google.com/sdk/docs/install

   # Authenticate with Google Cloud
   gcloud auth login

   # Set your default project
   gcloud config set project YOUR_PROJECT_ID
   ```

2. **Node.js**: Version 18 or higher
3. **npm**: For package management

## Installation

1. Clone or download this repository:
   ```bash
   git clone <repository-url>
   cd cloud-logging
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

## Usage

### With Cursor Editor

1. Open Cursor Settings
2. Navigate to "Features" → "Model Context Protocol"
3. Add a new MCP server with the following configuration:
   - **Name**: `gcloud-logging`
   - **Command**: `node`
   - **Arguments**: `["/Users/gordongao/Developer/github/ghprince/mcp-servers/cloud-logging/build/index.js"]`

### With Claude Desktop

Add the following to your Claude Desktop configuration file (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "gcloud-logging": {
      "command": "node",
      "args": ["/Users/gordongao/Developer/github/ghprince/mcp-servers/cloud-logging/build/index.js"]
    }
  }
}
```

### Manual Testing

You can test the server manually using the MCP Inspector:

```bash
npx @modelcontextprotocol/inspector node build/index.js
```

## Available Tool

### gcloud_logging_read
Read log entries using the `gcloud logging read` command.

**Parameters:**
- `filter` (optional): Log filter expression (e.g., 'severity>=ERROR')
- `limit` (optional): Maximum number of entries to return
- `project` (optional): Google Cloud project ID (uses current project if not specified)
- `format` (optional): Output format (json, table, yaml, csv, value) - default: json

**Examples:**

1. **Read recent error logs:**
   ```
   filter: "severity>=ERROR"
   limit: 20
   since: "1h"
   ```

2. **Read logs from a specific resource:**
   ```
   filter: "resource.type=\"gce_instance\""
   limit: 50
   ```

3. **Complex timestamp filter (now properly supported):**
   ```
   filter: "timestamp>=\"2025-05-28T17:15:20Z\" AND timestamp<=\"2025-05-28T17:15:35Z\""
   format: "json"
   limit: 20
   ```

## Common Log Filters

Here are some useful log filter examples based on the [Google Cloud Logging documentation](https://cloud.google.com/logging/docs/reference/tools/gcloud-logging#reading_log_entries):

- **Severity-based**: `severity>=ERROR`
- **Resource-based**: `resource.type="gce_instance"`
- **Time-based**: `timestamp>="2024-01-01T00:00:00Z"`
- **Text search**: `textPayload:"error"`
- **JSON payload**: `jsonPayload.level="ERROR"`
- **Combined**: `severity>=WARNING AND resource.type="k8s_container"`
- **Log name**: `logName="projects/PROJECT_ID/logs/LOG_NAME"`

## Troubleshooting

### Authentication Issues
If you encounter authentication errors:
```bash
gcloud auth login
gcloud auth application-default login
```

### Permission Issues
Ensure your account has the necessary IAM permissions:
- `roles/logging.viewer` - To read logs

### Project Configuration
Check your current project configuration:
```bash
gcloud config list
```

Set a different project:
```bash
gcloud config set project YOUR_PROJECT_ID
```

### Testing gcloud logging read
Test the command directly:
```bash
gcloud logging read "severity>=ERROR" --limit=10 --format=json
```

## Development

### Building
```bash
npm run build
```

### Watch Mode
```bash
npm run watch
```

### Running Locally
```bash
npm run dev
```

## Security Considerations

- This server executes `gcloud logging read` commands on your local machine
- It uses your current `gcloud` authentication and project configuration
- All operations are read-only (no log modification capabilities)
- The server runs locally and doesn't expose any network endpoints

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## References

- [Google Cloud Logging Documentation](https://cloud.google.com/logging/docs)
- [gcloud logging read command](https://cloud.google.com/logging/docs/reference/tools/gcloud-logging#reading_log_entries)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
