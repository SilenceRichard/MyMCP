# MyMCP 快速入门指南

本指南将帮助您快速上手 MyMCP 服务器，这是一个基于 Model Context Protocol (MCP) 的服务器实现。

## 安装

```bash
# 克隆仓库
git clone <your-repo-url>

# 进入项目目录
cd MyMCP

# 安装依赖
npm install

# 构建项目
npm run build
```

## 运行 stdio 服务器

stdio 服务器通过标准输入/输出流进行通信，适合本地开发和测试。

```bash
# 启动 stdio 服务器
npm start
```

## 运行 SSE 服务器

SSE 服务器通过 HTTP 服务器进行通信，适合远程服务和生产环境。

```bash
# 启动 SSE 服务器（默认端口 3000）
npm run start:sse

# 启动带有认证的 SSE 服务器
npm run start:sse:auth
# 或自定义端口和认证令牌
node build/sse-server.js --port=8080 --token=your-secret-token
```

## 使用 MCP Inspector 进行测试

MCP Inspector 是一个调试工具，可以帮助您测试和调试 MCP 服务器。

```bash
# 通过 stdio 测试服务器
npm run inspector

# 测试 SSE 服务器
# 1. 先启动 SSE 服务器
npm run start:sse
# 2. 在 Inspector UI 中，点击"Connect to Server"
# 3. 输入 SSE 端点 URL（例如 http://localhost:3000/sse）
# 4. 如果启用了认证，输入您的令牌
```

## 可用的工具和资源

MyMCP 服务器提供了以下工具：

1. **hello** - 向用户问好
2. **echo** - 回显用户的消息
3. **add** - 添加两个数字

还提供了以下资源：

1. **greeting** - 动态问候资源
2. **info** - 服务器信息

## 与 Claude Desktop 集成

要将 MyMCP 服务器与 Claude Desktop 集成：

1. 启动您的服务器（stdio 或 SSE）
2. 在 Claude Desktop 中，添加新的 MCP 服务器
   - 对于 stdio：指向可执行文件 (build/index.js)
   - 对于 SSE：提供服务器 URL 和任何必要的认证

## 下一步

参考完整的 [README.md](./README.md) 获取更多详细信息，包括服务器实现和高级功能。 