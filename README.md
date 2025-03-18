# MyMCP - Model Context Protocol Server

## Overview

MyMCP is a Model Context Protocol (MCP) server implementation. MCP is an open protocol designed by Anthropic that standardizes how applications provide context to LLMs (Large Language Models), making it easier to connect AI models with various data sources and tools.

## What is MCP?

The Model Context Protocol (MCP) enables:

- Standardized communication between LLMs and data sources/tools
- Switching between different LLM providers seamlessly
- Securing data within your infrastructure
- Building agents and complex workflows on top of LLMs

The protocol follows a client-server architecture:
- **MCP Hosts**: Programs like Claude Desktop, IDEs, or AI tools that want to access data through MCP
- **MCP Clients**: Protocol clients that maintain connections with servers
- **MCP Servers**: Lightweight programs that expose specific capabilities through MCP
- **Data Sources**: Local or remote data that MCP servers can access

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn package manager

### Installation

```bash
# Clone the repository
git clone <your-repo-url>

# Navigate to the project directory
cd MyMCP

# Install dependencies
npm install
```

### Setup Development Environment

1. Install the MCP SDK:
```bash
npm install @modelcontextprotocol/sdk
```

2. For TypeScript development, add these dev dependencies:
```bash
npm install --save-dev typescript @types/node
```

3. Create a `tsconfig.json` file in the root directory:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "./build",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

4. Create a source directory for your code:
```bash
mkdir src
```

### Building Your First MCP Server

Create a basic server in `src/index.ts`:

```typescript
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Create an MCP server
const server = new McpServer({
  name: "MyMCP",
  version: "1.0.0"
});

// Add a simple tool
server.tool("hello",
  { name: z.string() },
  async ({ name }) => ({
    content: [{ type: "text", text: `Hello, ${name}!` }]
  })
);

// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();
await server.connect(transport);
```

### Building and Running

Add the following scripts to your `package.json`:

```json
"scripts": {
  "build": "tsc && node -e \"require('fs').chmodSync('build/index.js', '755')\"",
  "prepare": "npm run build",
  "watch": "tsc --watch",
  "inspector": "npx @modelcontextprotocol/inspector build/index.js"
}
```

Then run:

```bash
# Build once
npm run build

# Or watch mode for development
npm run watch

# Run your server
npm start

# Test with MCP Inspector
npm run inspector
```

## Running the SSE Server

This project includes both a stdio-based server and an SSE (Server-Sent Events) based server. The SSE server uses Express to create an HTTP server that clients can connect to.

To run the SSE server:

```bash
# Start the SSE server on the default port (3000)
npm run start:sse

# Start with a custom port and authentication token
npm run start:sse:auth
# or 
node build/sse-server.js --port=8080 --token=your-secret-token
```

### Connecting to the SSE Server

When the SSE server is running:

1. The SSE endpoint is available at `http://localhost:<port>/sse`
2. The message endpoint is available at `http://localhost:<port>/messages`

If you enabled authentication, you'll need to include a Bearer token in your requests:

```
Authorization: Bearer your-secret-token
```

## Transport Methods in MCP

MCP supports different transport methods for communication between clients and servers:

### Stdio Transport

Stdio transport (used in this example) is the simplest transport method:

- Communication happens via standard input/output streams
- Ideal for local development and testing
- Used by the MCP Inspector for debugging
- No network configuration required
- Commands are sent over stdin and responses come back over stdout

```typescript
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const transport = new StdioServerTransport();
await server.connect(transport);
```

### SSE (Server-Sent Events) Transport

SSE transport enables network-based communication:

- Runs as an HTTP server that clients can connect to
- Supports multiple concurrent clients
- Enables integration with remote services
- Supports authentication via bearer tokens
- Better for production deployments

```typescript
import express from 'express';
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";

const app = express();

app.get("/sse", async (req, res) => {
  const transport = new SSEServerTransport("/messages", res);
  await server.connect(transport);
});

app.post("/messages", async (req, res) => {
  await transport.handlePostMessage(req, res);
});

app.listen(3000);
```

## Debugging with MCP Inspector

The MCP Inspector is a developer tool for testing and debugging MCP servers.

### Using MCP Inspector

Our package.json includes a script to launch the inspector:

```bash
npm run inspector
```

This runs the MCP Inspector, which:

1. Starts a proxy server (default port 3000)
2. Launches a web UI (default port 5173)
3. Connects to your MCP server via stdio

You can customize the ports if needed:

```bash
CLIENT_PORT=8080 SERVER_PORT=9000 npm run inspector
```

### Advanced Inspector Usage

Pass arguments to your server:

```bash
npx @modelcontextprotocol/inspector build/index.js arg1 arg2
```

Pass environment variables:

```bash
npx @modelcontextprotocol/inspector -e KEY=value -e KEY2=$VALUE2 node build/index.js
```

Pass both:

```bash
npx @modelcontextprotocol/inspector -e KEY=value -e KEY2=$VALUE2 node build/index.js arg1 arg2
```

### Testing SSE Connections

When using SSE transport, the Inspector can connect to your server via HTTP instead of stdio:

1. Start your SSE server: `npm run start:sse`
2. In the Inspector UI:
   - Click "Connect to Server"
   - Enter the SSE endpoint URL (e.g., `http://localhost:3000/sse`)
   - If authentication is enabled, enter your bearer token
3. The Inspector will establish an SSE connection and you can test your server

### Key Inspector Features

- Interactive tool execution
- Resource browsing
- Message history
- Manual JSON-RPC requests
- Connection status monitoring

## Key Concepts

### Resources

Resources in MCP are pieces of content that an LLM can access, such as:
- Files
- Database records
- API responses

### Tools

Tools allow an LLM to perform actions through your server, like:
- Making API calls
- Running calculations
- Accessing specific data sources

### Prompts

Prompts let you define reusable prompt templates that LLMs can use.

## Examples

### Echo Tool Example

```typescript
server.tool(
  "echo",
  { message: z.string() },
  async ({ message }) => ({
    content: [{ type: "text", text: `Tool echo: ${message}` }]
  })
);
```

### Dynamic Resource Example

```typescript
server.resource(
  "greeting",
  new ResourceTemplate("greeting://{name}", { list: undefined }),
  async (uri, { name }) => ({
    contents: [{
      uri: uri.href,
      text: `Hello, ${name}!`
    }]
  })
);
```

## Integration

To use this MCP server with a compatible host (like Claude Desktop):

1. Start your server (using either stdio or SSE transport)
2. Configure the host to connect to your server
   - For stdio: Point to your executable
   - For SSE: Provide the server URL and any required authentication
3. The host will be able to access the resources and tools your server provides

## Resources

- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)
- [MCP Specification](https://modelcontextprotocol.io/specification)
- [TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Example Servers](https://modelcontextprotocol.io/example-servers)
- [MCP Inspector](https://github.com/modelcontextprotocol/inspector)

## License

This project is licensed under the ISC License - see the LICENSE file for details.