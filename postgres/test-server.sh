#!/bin/bash

# Test script for PostgreSQL MCP Server

echo "Building the server..."
npm run build

if [ $? -ne 0 ]; then
    echo "Build failed!"
    exit 1
fi

echo -e "\n=== Testing MCP Server ==="

echo -e "\n1. Testing tools/list:"
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}' | node dist/index.js | jq .

echo -e "\n2. Testing list_pg_services:"
echo '{"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": "list_pg_services", "arguments": {}}}' | node dist/index.js | jq .

echo -e "\n3. Testing PostgreSQL connection:"
if psql service=labrador -c "SELECT version();" >/dev/null 2>&1; then
    echo "✅ PostgreSQL connection successful"

    echo -e "\n4. Testing execute_pg_query:"
    echo '{"jsonrpc": "2.0", "id": 3, "method": "tools/call", "params": {"name": "execute_pg_query", "arguments": {"service": "labrador", "query": "SELECT version();"}}}' | node dist/index.js | jq .
else
    echo "❌ PostgreSQL connection failed - make sure your database is running"
fi

echo -e "\n=== Test Complete ==="
