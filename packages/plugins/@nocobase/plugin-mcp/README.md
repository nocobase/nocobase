# @nocobase/plugin-mcp

内置 MCP（Model Context Protocol）服务端（SSE/HTTP），固定端点（走 `/api/*`，避免网关将非 `/api/*` 回退到 `index.html`）：

- `GET /api/mcp`（SSE）
- `POST /api/mcp/message`（SSE 消息入口）
- `POST /api/mcp`（streamable HTTP 兼容入口，便于 Codex 等客户端直接接入）

同时复用现有 `/ws` 通道做前端桥接，使外部 Agent 能拿到与前端 AI 员工（Nathan）同等或更强的 FlowContext/CodeEditor 上下文，并可进行区块增删改移等 UI 操作。

当页面未打开 CodeEditor 时，也可通过 `nocobase.pages.list` 获取当前 UI 会话的 `pageUid`（PageModel uid），并在 `nocobase.flowContext.*` / `nocobase.ui.flowEngine.*` 调用中传入 `pageUid` 以实时操作当前页面 UI。

## 在 Codex CLI 中添加 MCP

假设你的 NocoBase 运行在 `http://127.0.0.1:13000`（如为远端环境，替换为对应 IP/域名与端口），则可用 `codex mcp add` 直接添加（本插件为 streamable HTTP/SSE MCP，不需要任何 token）：

```bash
codex mcp add nocobase --url http://127.0.0.1:13000/api/mcp
```

可用以下命令查看是否添加成功：

```bash
codex mcp list
```
