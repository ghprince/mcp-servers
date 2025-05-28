#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { spawn } from "child_process";

const server = new McpServer({
  name: "gcloud-logging-server",
  version: "1.0.0",
});

// Helper function to execute gcloud commands using spawn for proper argument handling
async function executeGcloudCommand(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const process = spawn('gcloud', args, {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    process.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`gcloud command failed with exit code ${code}: ${stderr}`));
      } else if (stderr && !stderr.includes("WARNING")) {
        reject(new Error(`gcloud command failed: ${stderr}`));
      } else {
        resolve(stdout.trim());
      }
    });

    process.on('error', (error) => {
      reject(new Error(`Failed to execute gcloud command: ${error.message}`));
    });
  });
}

// Tool: Read log entries using gcloud logging read
server.tool(
  "gcloud_logging_read",
  "Read log entries using gcloud logging read command",
  {
    filter: z.string().optional().describe("Log filter expression (e.g., 'severity>=ERROR')"),
    limit: z.number().optional().describe("Maximum number of entries to return"),
    project: z.string().optional().describe("Google Cloud project ID (uses current project if not specified)"),
    format: z.enum(["json", "table", "yaml", "csv", "value"]).optional().default("json").describe("Output format"),
  },
  async ({ filter, limit, project, format}) => {
    const args: string[] = ['logging', 'read'];

    // Add the filter as the first positional argument
    if (filter) {
      args.push(filter);
    } else {
      // If no filter provided, use empty string
      args.push('');
    }

    if (limit) {
      args.push(`--limit=${limit}`);
    }

    if (project) {
      args.push(`--project=${project}`);
    }

    if (format) {
      args.push(`--format=${format}`);
    }

    try {
      const result = await executeGcloudCommand(args);
      return {
        content: [
          {
            type: "text",
            text: `Log entries:\n\n${result}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error reading log entries: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Start the server
async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Google Cloud Logging MCP server started and listening on stdio");
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
