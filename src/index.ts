#!/usr/bin/env node

import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

/**
 * Main function to set up and start the MCP server
 */
async function main() {
  // Create a new MCP server instance
  const server = new McpServer({
    name: "MyMCP",
    version: "1.0.0",
    description: "A simple MCP server example"
  });

  // Add a simple hello tool
  server.tool(
    "hello",
    { name: z.string().describe("The name to greet") },
    async ({ name }) => ({
      content: [{ 
        type: "text", 
        text: `Hello, ${name}! Welcome to MyMCP server.` 
      }]
    })
  );

  // Add an echo tool
  server.tool(
    "echo",
    { message: z.string().describe("The message to echo back") },
    async ({ message }) => ({
      content: [{ type: "text", text: `Echo: ${message}` }]
    })
  );

  // Add a simple calculator tool for addition
  server.tool(
    "add",
    { 
      a: z.number().describe("First number"), 
      b: z.number().describe("Second number") 
    },
    async ({ a, b }) => ({
      content: [{ type: "text", text: `Result: ${a + b}` }]
    })
  );

  // Add a dynamic greeting resource
  server.resource(
    "greeting",
    new ResourceTemplate("greeting://{name}", { list: undefined }),
    async (uri, { name }) => ({
      contents: [{
        uri: uri.href,
        text: `Greetings, ${name}! This is a resource response from MyMCP.`
      }]
    })
  );

  // Add a static info resource
  server.resource(
    "info",
    "info://server",
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: "MyMCP Server Information:\n" +
              "- Version: 1.0.0\n" +
              "- Description: A simple MCP server example\n" +
              "- Made with: MCP TypeScript SDK"
      }]
    })
  );

  // Add a simple prompt template
  server.prompt(
    "question",
    { 
      topic: z.string().describe("The topic to ask about"),
      difficulty: z.enum(["easy", "medium", "hard"]).describe("Difficulty level")
    },
    ({ topic, difficulty }) => ({
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: `Please generate a ${difficulty} question about ${topic}. After the question, provide a detailed answer.`
        }
      }]
    })
  );

  // Connect the server to stdin/stdout transport
  console.error("Starting MyMCP server...");
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MyMCP server connected and ready!");
}

// Run the main function and handle errors
main().catch(err => {
  console.error("Error starting MCP server:", err);
  process.exit(1);
}); 