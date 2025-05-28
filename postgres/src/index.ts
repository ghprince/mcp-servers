#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { exec } from "child_process";
import { promisify } from "util";
import { readFile } from "fs/promises";
import { homedir } from "os";
import { join } from "path";
import { z } from "zod";

const execAsync = promisify(exec);

interface PostgreSQLService {
  name: string;
  host?: string;
  port?: string;
  dbname?: string;
  user?: string;
}

class PostgreSQLMCPServer {
  private server: McpServer;
  private services: PostgreSQLService[] = [];

  constructor() {
    this.server = new McpServer({
      name: "postgresql-mcp-server",
      version: "1.0.0"
    });
  }

  private async loadPgServices(): Promise<void> {
    try {
      const pgServicePath = join(homedir(), '.pg_service.conf');
      const content = await readFile(pgServicePath, 'utf-8');

      this.services = this.parsePgServiceConf(content);
      console.error(`Loaded ${this.services.length} PostgreSQL services from pg_service.conf`);
    } catch (error) {
      console.error('Failed to load pg_service.conf:', error);
      this.services = [];
    }
  }

  private parsePgServiceConf(content: string): PostgreSQLService[] {
    const services: PostgreSQLService[] = [];
    const lines = content.split('\n');
    let currentService: Partial<PostgreSQLService> | null = null;

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      // Service section header
      const serviceMatch = trimmed.match(/^\[([^\]]+)\]$/);
      if (serviceMatch) {
        if (currentService && currentService.name) {
          services.push(currentService as PostgreSQLService);
        }
        currentService = { name: serviceMatch[1] };
        continue;
      }

      // Service property
      const propMatch = trimmed.match(/^([^=]+)=(.*)$/);
      if (propMatch && currentService) {
        const [, key, value] = propMatch;
        const cleanKey = key.trim();
        const cleanValue = value.trim();

        switch (cleanKey) {
          case 'host':
            currentService.host = cleanValue;
            break;
          case 'port':
            currentService.port = cleanValue;
            break;
          case 'dbname':
            currentService.dbname = cleanValue;
            break;
          case 'user':
            currentService.user = cleanValue;
            break;
        }
      }
    }

    // Add the last service
    if (currentService && currentService.name) {
      services.push(currentService as PostgreSQLService);
    }

    return services;
  }

  private setupTools(): void {
    // Tool to list available PostgreSQL services
    this.server.tool(
      "list_pg_services",
      {},
      async () => {
        await this.loadPgServices();

        const serviceList = this.services.map(service => {
          return `• ${service.name}: ${service.host || 'localhost'}:${service.port || '5432'}/${service.dbname || service.name} (user: ${service.user || 'default'})`;
        }).join('\n');

        return {
          content: [
            {
              type: "text",
              text: `Available PostgreSQL services:\n${serviceList || 'No services found in pg_service.conf'}`
            }
          ]
        };
      }
    );

    // Tool to execute read-only SQL queries
    this.server.tool(
      "execute_pg_query",
      {
        service: z.string().describe("PostgreSQL service name from pg_service.conf"),
        query: z.string().describe("SQL query to execute (read-only operations only)"),
        format: z.enum(["table", "csv", "json", "html"]).optional().default("table").describe("Output format for the query results")
      },
      async ({ service, query, format = "table" }) => {
        // Basic validation for read-only operations
        const readOnlyPattern = /^\s*(SELECT|SHOW|DESCRIBE|EXPLAIN|WITH)/i;
        if (!readOnlyPattern.test(query.trim())) {
          throw new Error("Only read-only queries (SELECT, SHOW, DESCRIBE, EXPLAIN, WITH) are allowed");
        }

        const formatFlag = this.getFormatFlag(format);
        const command = `psql service=${service} ${formatFlag} -c "${query.replace(/"/g, '\\"')}"`;

        try {
          const { stdout, stderr } = await execAsync(command);

          if (stderr && !stderr.includes('NOTICE:')) {
            throw new Error(`PostgreSQL error: ${stderr}`);
          }

          return {
            content: [
              {
                type: "text",
                text: stdout || "Query executed successfully (no output)"
              }
            ]
          };
        } catch (error) {
          throw new Error(`Failed to execute query: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    );

    // Tool to describe table structure
    this.server.tool(
      "describe_pg_table",
      {
        service: z.string().describe("PostgreSQL service name from pg_service.conf"),
        table: z.string().describe("Table name to describe"),
        schema: z.string().optional().default("public").describe("Schema name (optional, defaults to public)")
      },
      async ({ service, table, schema = "public" }) => {
        const query = `\\d+ ${schema}.${table}`;
        const command = `psql service=${service} -c "${query}"`;

        try {
          const { stdout, stderr } = await execAsync(command);

          if (stderr && !stderr.includes('NOTICE:')) {
            throw new Error(`PostgreSQL error: ${stderr}`);
          }

          return {
            content: [
              {
                type: "text",
                text: stdout || `No information found for table ${schema}.${table}`
              }
            ]
          };
        } catch (error) {
          throw new Error(`Failed to describe table: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    );

    // Tool to list tables in a schema
    this.server.tool(
      "list_pg_tables",
      {
        service: z.string().describe("PostgreSQL service name from pg_service.conf"),
        schema: z.string().optional().default("public").describe("Schema name (optional, defaults to public)")
      },
      async ({ service, schema = "public" }) => {
        const query = `SELECT table_name, table_type FROM information_schema.tables WHERE table_schema = '${schema}' ORDER BY table_name;`;
        const command = `psql service=${service} -c "${query}"`;

        try {
          const { stdout, stderr } = await execAsync(command);

          if (stderr && !stderr.includes('NOTICE:')) {
            throw new Error(`PostgreSQL error: ${stderr}`);
          }

          return {
            content: [
              {
                type: "text",
                text: stdout || `No tables found in schema ${schema}`
              }
            ]
          };
        } catch (error) {
          throw new Error(`Failed to list tables: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    );
  }

  private getFormatFlag(format: string): string {
    switch (format) {
      case "csv":
        return "--csv";
      case "json":
        return "--json";
      case "html":
        return "--html";
      case "table":
      default:
        return "";
    }
  }

  async start(): Promise<void> {
    // Load services and setup tools before connecting
    await this.loadPgServices();
    this.setupTools();

    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("PostgreSQL MCP Server started");
  }
}

// Start the server
const server = new PostgreSQLMCPServer();
server.start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
