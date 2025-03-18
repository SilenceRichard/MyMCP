#!/usr/bin/env node

import express from 'express';
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";

/**
 * Main function to set up and start the MCP server with SSE transport
 */
async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const portArg = args.find(arg => arg.startsWith("--port="));
  const port = portArg ? parseInt(portArg.split("=")[1], 10) : 3000;
  
  const tokenArg = args.find(arg => arg.startsWith("--token="));
  const token = tokenArg ? tokenArg.split("=")[1] : undefined;
  
  // Create a new MCP server instance
  const server = new McpServer({
    name: "MyMCP-SSE",
    version: "1.0.0",
    description: "MyMCP server with SSE transport"
  });

  // Add a simple hello tool
  server.tool(
    "hello",
    { name: z.string().describe("The name to greet") },
    async ({ name }) => ({
      content: [{ 
        type: "text", 
        text: `Hello, ${name}! Welcome to MyMCP server (SSE).` 
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
        text: `Greetings, ${name}! This is a resource response from MyMCP (SSE).`
      }]
    })
  );

  // Set up Express app
  const app = express();
  
  // Create an object to store active transports
  const transports: Record<string, SSEServerTransport> = {};
  
  // Setup authentication middleware if token is provided
  const authenticate = token ? (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    
    const providedToken = authHeader.split(' ')[1];
    if (providedToken !== token) {
      res.status(403).json({ error: 'Invalid token' });
      return;
    }
    
    next();
  } : (req: express.Request, res: express.Response, next: express.NextFunction) => next();
  
  // SSE connection endpoint
  app.get('/sse', authenticate, async (req, res) => {
    // Generate a unique ID for this connection
    const connectionId = Date.now().toString();
    
    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Create a new transport for this connection
    const transport = new SSEServerTransport('/messages', res);
    transports[connectionId] = transport;
    
    // Remove transport when connection closes
    req.on('close', () => {
      delete transports[connectionId];
      console.log(`Connection ${connectionId} closed`);
    });
    
    // Connect the server to this transport
    await server.connect(transport);
    console.log(`New connection established: ${connectionId}`);
  });
  
  // Message receiving endpoint
  app.post('/messages', express.json(), authenticate, async (req, res) => {
    // In a real-world app, you'd identify which transport to use
    // For now, we'll use the most recent one
    const transportIds = Object.keys(transports);
    if (transportIds.length === 0) {
      res.status(400).json({ error: 'No active connections' });
      return;
    }
    
    const transport = transports[transportIds[transportIds.length - 1]];
    await transport.handlePostMessage(req, res);
  });
  
  // Start the server
  app.listen(port, () => {
    console.log(`MyMCP server with SSE transport is running on http://localhost:${port}`);
    console.log(`Connect to http://localhost:${port}/sse for SSE endpoint`);
    console.log(`Send messages to http://localhost:${port}/messages`);
    if (token) {
      console.log(`Authentication required with token: ${token}`);
    } else {
      console.log(`No authentication required`);
    }
    console.log(`Press Ctrl+C to stop the server`);
  });
}

// Run the main function and handle errors
main().catch(err => {
  console.error("Error starting MCP server:", err);
  process.exit(1);
}); 