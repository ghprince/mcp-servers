# PostgreSQL MCP Server

A Model Context Protocol (MCP) server that provides read-only PostgreSQL database query tools for Cursor editor. This server uses the `psql` CLI and reads database configurations from your `pg_service.conf` file.

## Features

- **Read-only queries**: Execute SELECT, SHOW, DESCRIBE, EXPLAIN, and WITH queries
- **Service discovery**: Automatically loads PostgreSQL services from `~/.pg_service.conf`
- **Multiple output formats**: Support for table, CSV, JSON, and HTML output formats
- **Table introspection**: List tables and describe table structures
- **Security**: Only allows read-only operations to prevent accidental data modification

## Prerequisites

1. **PostgreSQL client tools**: Ensure `psql` is installed and available in your PATH
2. **pg_service.conf**: Configure your PostgreSQL services in `~/.pg_service.conf`
3. **pgpass.conf**: Configure your PostgreSQL password in `~/.pgpass`

### Example pg_service.conf

```ini
[production]
host=prod.example.com
port=5432
dbname=myapp
user=readonly_user

[staging]
host=staging.example.com
port=5432
dbname=myapp_staging
user=staging_user
```

## Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the TypeScript code:
   ```bash
   npm run build
   ```

## Usage with Cursor

### 1. Configure Cursor MCP Settings

Add the following to your Cursor MCP configuration file. The configuration file location varies by system:

- **macOS**: `~/Library/Application Support/Cursor/User/globalStorage/rooveterinaryinc.cursor-small/mcp_servers.json`
- **Linux**: `~/.config/Cursor/User/globalStorage/rooveterinaryinc.cursor-small/mcp_servers.json`
- **Windows**: `%APPDATA%\Cursor\User\globalStorage\rooveterinaryinc.cursor-small\mcp_servers.json`

```json
{
  "mcpServers": {
    "postgresql": {
      "command": "node",
      "args": ["/Users/gordongao/Developer/github/ghprince/mcp-servers/postgres/dist/index.js"],
      "env": {}
    }
  }
}
```

**Important**: Replace `/Users/gordongao/Developer/github/ghprince/mcp-servers/postgres/dist/index.js` with the absolute path to your built `index.js` file.

### 2. Available Tools

Once configured, you'll have access to these tools in Cursor:

#### `list_pg_services`
Lists all PostgreSQL services configured in your pg_service.conf file.

#### `execute_pg_query`
Execute read-only SQL queries on your PostgreSQL databases.

**Parameters:**
- `service`: PostgreSQL service name from pg_service.conf
- `query`: SQL query to execute (SELECT, SHOW, DESCRIBE, EXPLAIN, WITH only)
- `format`: Output format (table, csv, json, html) - optional, defaults to table

**Example:**
```sql
SELECT * FROM users WHERE created_at > '2024-01-01' LIMIT 10;
```

#### `describe_pg_table`
Get detailed information about a table's structure.

**Parameters:**
- `service`: PostgreSQL service name
- `table`: Table name to describe
- `schema`: Schema name (optional, defaults to "public")

#### `list_pg_tables`
List all tables in a database schema.

**Parameters:**
- `service`: PostgreSQL service name
- `schema`: Schema name (optional, defaults to "public")

## Development

### Running in Development Mode

```bash
npm run dev
```

### Building

```bash
npm run build
```

### Testing the Server

You can test the server directly using stdio:

```bash
npm run build
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}' | node dist/index.js
```

Test a specific tool:

```bash
echo '{"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": "list_pg_services", "arguments": {}}}' | node dist/index.js
```

## Security Features

- **Read-only enforcement**: Only SELECT, SHOW, DESCRIBE, EXPLAIN, and WITH statements are allowed
- **Service-based access**: Only databases configured in pg_service.conf are accessible
- **No direct connection strings**: Uses PostgreSQL service names for security

## Troubleshooting

### Common Issues

1. **"psql: command not found"**
   - Install PostgreSQL client tools
   - Ensure `psql` is in your PATH

2. **"Failed to load pg_service.conf"**
   - Create `~/.pg_service.conf` with your database configurations
   - Ensure the file has proper read permissions

3. **Connection errors**
   - Verify your pg_service.conf settings
   - Test connections manually with `psql service=your_service_name`
   - Check network connectivity and authentication

4. **Permission denied errors**
   - Ensure your database user has SELECT permissions
   - Check if the database allows connections from your IP

### Testing Database Connections

Test your pg_service.conf configuration manually:

```bash
psql service=labrador -c "SELECT version();"
```

### Cursor Configuration Issues

1. **MCP server not appearing in Cursor**
   - Verify the configuration file path is correct for your OS
   - Ensure the absolute path to `dist/index.js` is correct
   - Restart Cursor after making configuration changes

2. **Tools not working**
   - Check that the server builds successfully with `npm run build`
   - Test the server manually using the stdio commands above
   - Verify your PostgreSQL services are accessible

## Example Usage

Once configured in Cursor, you can ask questions like:

- "List all available PostgreSQL services"
- "Show me all tables in the labrador database"
- "Describe the structure of the users table"
- "Execute this query: SELECT count(*) FROM users"

The MCP server will handle the database interactions and return formatted results.

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Related Links

- [Model Context Protocol Documentation](https://modelcontextprotocol.io)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [PostgreSQL Service File Documentation](https://www.postgresql.org/docs/current/libpq-pgservice.html)
