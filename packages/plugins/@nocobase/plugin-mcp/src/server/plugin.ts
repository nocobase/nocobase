/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SequelizeCollectionManager } from '@nocobase/data-source-manager';
import type Database from '@nocobase/database';
import { Plugin } from '@nocobase/server';
import { randomUUID } from 'crypto';

// NOTE: must live under /api/* because some gateways fallback all non-/api routes to index.html.
const MCP_SSE_PATH = '/api/mcp';
const MCP_MESSAGE_PATH = '/api/mcp/message';
const MCP_OAUTH_AUTHORIZATION_SERVER_PATH = '/api/mcp/.well-known/oauth-authorization-server';

// Backward-compatible aliases (may be unreachable behind certain gateways).
const MCP_SSE_ALIASES = ['/mcp'];
const MCP_MESSAGE_ALIASES = ['/mcp/message'];

const FRONTEND_RPC_TIMEOUT_MS = 30_000;

type UiSessionInfo = {
  sessionId: string;
  url?: string;
  ts?: number;
  lastSeenAt: number;
};

type PendingFrontendRpc = {
  requestId: string;
  clientId: string;
  timer: NodeJS.Timeout;
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
};

type McpConnection = {
  mcpSessionId: string;
  selectedUiSessionId?: string;
  createdAt: number;
  lastUsedAt: number;
};

type McpSdk = {
  Server: any;
  SSEServerTransport: any;
  ListToolsRequestSchema: any;
  CallToolRequestSchema: any;
};

let mcpSdkPromise: Promise<McpSdk> | null = null;
const dynamicImport = new Function('m', 'return import(m)') as (m: string) => Promise<any>;

async function getMcpSdk(): Promise<McpSdk> {
  if (mcpSdkPromise) return mcpSdkPromise;
  mcpSdkPromise = (async () => {
    const [{ Server }, { SSEServerTransport }, types] = await Promise.all([
      dynamicImport('@modelcontextprotocol/sdk/server/index.js'),
      dynamicImport('@modelcontextprotocol/sdk/server/sse.js'),
      dynamicImport('@modelcontextprotocol/sdk/types.js'),
    ]);

    return {
      Server,
      SSEServerTransport,
      ListToolsRequestSchema: types.ListToolsRequestSchema,
      CallToolRequestSchema: types.CallToolRequestSchema,
    };
  })();
  return mcpSdkPromise;
}

function toTextToolResult(data: any, options?: { isError?: boolean }) {
  const isError = !!options?.isError;
  let text: string;
  try {
    text = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  } catch (e) {
    text = String(data);
  }
  return {
    isError,
    toolResult: data,
    content: [
      {
        type: 'text',
        text,
      },
    ],
  };
}

function normalizeError(error: any) {
  if (!error) return { message: 'Unknown error' };
  return {
    message: String(error?.message || error),
    name: typeof error?.name === 'string' ? error.name : undefined,
    stack: typeof error?.stack === 'string' ? error.stack : undefined,
    code: typeof error?.code !== 'undefined' ? error.code : undefined,
    status: typeof error?.status !== 'undefined' ? error.status : undefined,
  };
}

export default class PluginMcpServer extends Plugin {
  private uiSessions = new Map<string, UiSessionInfo>();
  private pendingFrontendRpc = new Map<string, PendingFrontendRpc>();

  private mcpTransports = new Map<string, any>();
  private mcpConnections = new Map<string, McpConnection>();
  private mcpStreamableConnections = new Map<string, McpConnection>();

  async load() {
    this.bindWsBridge();
    this.mountMcpEndpoints();
  }

  private bindWsBridge() {
    this.app.on('ws:message:mcp:hello', ({ clientId, payload }) => {
      const now = Date.now();
      const url = payload?.url ? String(payload.url) : undefined;
      const ts = typeof payload?.ts === 'number' ? payload.ts : undefined;
      this.uiSessions.set(clientId, {
        sessionId: clientId,
        url,
        ts,
        lastSeenAt: now,
      });
    });

    this.app.on('ws:message:mcp:response', ({ clientId, payload }) => {
      const requestId = payload?.requestId ? String(payload.requestId) : '';
      if (!requestId) return;

      const pending = this.pendingFrontendRpc.get(requestId);
      if (!pending) return;
      if (pending.clientId !== clientId) return;

      clearTimeout(pending.timer);
      this.pendingFrontendRpc.delete(requestId);

      const ok = payload?.ok !== false;
      if (ok) {
        pending.resolve(payload?.result);
      } else {
        pending.reject(payload?.error || { message: 'Frontend RPC failed' });
      }
    });
  }

  private mountMcpEndpoints() {
    this.app.use(
      async (ctx, next) => {
        const ssePaths = [MCP_SSE_PATH, ...MCP_SSE_ALIASES];
        const messagePaths = [MCP_MESSAGE_PATH, ...MCP_MESSAGE_ALIASES];
        const oauthWellKnownPaths = [MCP_OAUTH_AUTHORIZATION_SERVER_PATH];
        if (
          !ssePaths.includes(ctx.path) &&
          !messagePaths.includes(ctx.path) &&
          !oauthWellKnownPaths.includes(ctx.path)
        ) {
          return next();
        }

        // Fully open CORS for MCP endpoints (this is not an auth/ACL feature).
        ctx.set('Access-Control-Allow-Origin', '*');
        ctx.set('Access-Control-Allow-Headers', '*');
        ctx.set('Access-Control-Expose-Headers', 'Mcp-Session-Id');
        ctx.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');

        if (ctx.method === 'OPTIONS') {
          ctx.status = 204;
          return;
        }

        if (oauthWellKnownPaths.includes(ctx.path) && ctx.method === 'GET') {
          // No OAuth server in this plugin; return 204 to avoid noisy 404 probing logs.
          ctx.status = 204;
          return;
        }

        if (ssePaths.includes(ctx.path) && ctx.method === 'GET') {
          // Always advertise the /api/* message endpoint so clients keep using /api even if a gateway rewrites
          // /api/mcp -> /mcp when proxying to the backend.
          await this.handleSseConnect(ctx, MCP_MESSAGE_PATH);
          return;
        }

        if (ssePaths.includes(ctx.path) && ctx.method === 'POST') {
          // Compatibility path for streamable-http clients posting JSON-RPC directly to /api/mcp.
          await this.handleStreamableHttpPost(ctx);
          return;
        }

        if (messagePaths.includes(ctx.path) && ctx.method === 'POST') {
          await this.handlePostMessage(ctx);
          return;
        }

        return next();
      },
      {
        tag: 'mcp',
        after: 'logger',
        before: 'bodyParser',
      },
    );
  }

  private getDefaultUiSessionId(): string | undefined {
    let best: UiSessionInfo | undefined;
    for (const s of this.uiSessions.values()) {
      if (!best || s.lastSeenAt > best.lastSeenAt) best = s;
    }
    return best?.sessionId;
  }

  private getServerInfo() {
    return {
      name: 'NocoBase MCP',
      version: String(this.app.getPackageVersion?.() || this.app.getVersion?.() || '0.0.0'),
    };
  }

  private createMcpConnection(preferredSessionId?: string): McpConnection {
    const mcpSessionId = String(preferredSessionId || randomUUID());
    return {
      mcpSessionId,
      selectedUiSessionId: this.getDefaultUiSessionId(),
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
    };
  }

  private async handleSseConnect(ctx: any, postPath: string) {
    const { Server, SSEServerTransport, ListToolsRequestSchema, CallToolRequestSchema } = await getMcpSdk();

    // NOTE: transport.start() will write headers; set extra headers before connect().
    ctx.res.setHeader('Access-Control-Allow-Origin', '*');
    ctx.res.setHeader('Access-Control-Allow-Headers', '*');

    const transport = new SSEServerTransport(String(postPath || MCP_MESSAGE_PATH), ctx.res);
    const mcpSessionId = String(transport.sessionId);

    const conn: McpConnection = this.createMcpConnection(mcpSessionId);

    const mcpServer = new Server(this.getServerInfo(), {
      capabilities: {
        tools: {
          listChanged: false,
        },
      },
    });

    mcpServer.onclose = () => {
      this.mcpTransports.delete(mcpSessionId);
      this.mcpConnections.delete(mcpSessionId);
    };
    mcpServer.onerror = (e: any) => {
      this.app.logger?.warn?.({ err: e }, '[plugin-mcp] mcpServer error');
    };

    const tools = this.getToolDefinitions();
    mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
      return { tools };
    });
    mcpServer.setRequestHandler(CallToolRequestSchema, async (request: any) => {
      conn.lastUsedAt = Date.now();
      const toolName = String(request?.params?.name || '');
      const args = (request?.params?.arguments || {}) as Record<string, any>;
      try {
        const result = await this.callTool(conn, toolName, args);
        return toTextToolResult(result);
      } catch (e) {
        return toTextToolResult({ error: normalizeError(e) }, { isError: true });
      }
    });

    this.mcpTransports.set(mcpSessionId, transport);
    this.mcpConnections.set(mcpSessionId, conn);

    ctx.respond = false;
    ctx.req.socket?.setTimeout?.(0);

    await mcpServer.connect(transport);
  }

  private async handlePostMessage(ctx: any) {
    const sessionId = ctx.query?.sessionId ? String(ctx.query.sessionId) : '';
    const transport = sessionId ? this.mcpTransports.get(sessionId) : null;
    if (!transport) {
      ctx.status = 404;
      ctx.body = `Unknown mcp sessionId: ${sessionId || '(empty)'}`;
      return;
    }

    // transport.handlePostMessage writes response directly.
    ctx.respond = false;
    ctx.res.setHeader('Access-Control-Allow-Origin', '*');
    ctx.res.setHeader('Access-Control-Allow-Headers', '*');
    await transport.handlePostMessage(ctx.req, ctx.res);
  }

  private getStreamableSessionId(ctx: any): string {
    const sessionId = ctx.get('mcp-session-id') || ctx.get('x-mcp-session-id') || '';
    return String(sessionId || '').trim();
  }

  private async readJsonBody(ctx: any) {
    const raw = await new Promise<string>((resolve, reject) => {
      const chunks: Buffer[] = [];
      ctx.req.on('data', (chunk: Buffer | string) => {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
      });
      ctx.req.on('end', () => {
        resolve(Buffer.concat(chunks).toString('utf8'));
      });
      ctx.req.on('error', reject);
    });
    const text = String(raw || '').trim();
    if (!text) return {};
    return JSON.parse(text);
  }

  private writeJsonRpcResult(ctx: any, id: any, result: any, sessionId?: string) {
    if (sessionId) ctx.set('Mcp-Session-Id', sessionId);
    ctx.type = 'application/json';
    ctx.status = 200;
    ctx.body = {
      jsonrpc: '2.0',
      id: typeof id === 'undefined' ? null : id,
      result,
    };
  }

  private writeJsonRpcError(ctx: any, id: any, code: number, message: string, data?: any, sessionId?: string) {
    if (sessionId) ctx.set('Mcp-Session-Id', sessionId);
    ctx.type = 'application/json';
    ctx.status = 200;
    ctx.body = {
      jsonrpc: '2.0',
      id: typeof id === 'undefined' ? null : id,
      error: {
        code,
        message,
        ...(typeof data === 'undefined' ? {} : { data }),
      },
    };
  }

  private async handleStreamableHttpPost(ctx: any) {
    let payload: any;
    try {
      payload = await this.readJsonBody(ctx);
    } catch (e) {
      this.writeJsonRpcError(ctx, null, -32700, 'Parse error', normalizeError(e));
      return;
    }

    if (!payload || Array.isArray(payload) || typeof payload !== 'object') {
      this.writeJsonRpcError(ctx, null, -32600, 'Invalid Request');
      return;
    }

    const id = Object.prototype.hasOwnProperty.call(payload, 'id') ? payload.id : undefined;
    const method = typeof payload?.method === 'string' ? String(payload.method) : '';
    const params = (payload?.params || {}) as Record<string, any>;
    const isNotification = typeof id === 'undefined';

    if (!method) {
      if (isNotification) {
        ctx.status = 202;
        return;
      }
      this.writeJsonRpcError(ctx, id, -32600, 'Invalid Request');
      return;
    }

    if (method === 'initialize') {
      let sessionId = this.getStreamableSessionId(ctx);
      let conn = sessionId ? this.mcpStreamableConnections.get(sessionId) : undefined;
      if (!conn) {
        conn = this.createMcpConnection(sessionId);
        sessionId = conn.mcpSessionId;
      }
      conn.lastUsedAt = Date.now();
      this.mcpStreamableConnections.set(sessionId, conn);
      this.mcpConnections.set(sessionId, conn);

      const requestedProtocolVersion =
        typeof params?.protocolVersion === 'string' ? String(params.protocolVersion) : '';
      const protocolVersion = requestedProtocolVersion || '2024-11-05';
      const result = {
        protocolVersion,
        capabilities: {
          tools: {
            listChanged: false,
          },
        },
        serverInfo: this.getServerInfo(),
      };

      if (isNotification) {
        ctx.set('Mcp-Session-Id', sessionId);
        ctx.status = 202;
        return;
      }
      this.writeJsonRpcResult(ctx, id, result, sessionId);
      return;
    }

    const sessionId = this.getStreamableSessionId(ctx);
    const conn = (sessionId && this.mcpStreamableConnections.get(sessionId)) || undefined;
    if (!sessionId || !conn) {
      if (isNotification) {
        ctx.status = 202;
        return;
      }
      this.writeJsonRpcError(ctx, id, -32001, 'Session not initialized');
      return;
    }

    conn.lastUsedAt = Date.now();
    this.mcpConnections.set(sessionId, conn);
    this.mcpStreamableConnections.set(sessionId, conn);

    if (method.startsWith('notifications/')) {
      ctx.set('Mcp-Session-Id', sessionId);
      ctx.status = 202;
      return;
    }
    if (isNotification) {
      ctx.set('Mcp-Session-Id', sessionId);
      ctx.status = 202;
      return;
    }

    if (method === 'ping') {
      this.writeJsonRpcResult(ctx, id, {}, sessionId);
      return;
    }
    if (method === 'tools/list') {
      this.writeJsonRpcResult(ctx, id, { tools: this.getToolDefinitions() }, sessionId);
      return;
    }
    if (method === 'tools/call') {
      const toolName = String(params?.name || '');
      const args = (params?.arguments || {}) as Record<string, any>;
      if (!toolName) {
        this.writeJsonRpcError(
          ctx,
          id,
          -32602,
          'Invalid params: tools/call requires params.name',
          undefined,
          sessionId,
        );
        return;
      }
      try {
        const result = await this.callTool(conn, toolName, args);
        this.writeJsonRpcResult(ctx, id, toTextToolResult(result), sessionId);
      } catch (e) {
        this.writeJsonRpcResult(ctx, id, toTextToolResult({ error: normalizeError(e) }, { isError: true }), sessionId);
      }
      return;
    }

    this.writeJsonRpcError(ctx, id, -32601, `Method not found: ${method}`, undefined, sessionId);
  }

  private getToolDefinitions() {
    const sessionIdProp = {
      type: 'string',
      description: 'UI sessionId (NocoBase /ws clientId). Optional; defaults to selected/recent session.',
    };
    const editorUidProp = { type: 'string', description: 'Editor UID (stable within UI session).' };
    const pageUidProp = {
      type: 'string',
      description: 'Page UID (PageModel uid). Optional; used when no CodeEditor context.',
    };

    return [
      {
        name: 'nocobase.sessions.list',
        description: 'List active UI sessions registered via WebSocket bridge.',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'nocobase.sessions.select',
        description: 'Select the default UI session for this MCP connection.',
        inputSchema: {
          type: 'object',
          properties: { sessionId: sessionIdProp },
          required: ['sessionId'],
        },
      },
      {
        name: 'nocobase.pages.list',
        description: 'List active PageModel contexts in selected UI session (view stack).',
        inputSchema: { type: 'object', properties: { sessionId: sessionIdProp } },
      },
      {
        name: 'nocobase.editors.list',
        description: 'List active CodeEditor instances in selected UI session.',
        inputSchema: { type: 'object', properties: { sessionId: sessionIdProp } },
      },
      {
        name: 'nocobase.editors.read',
        description: 'Read code from a CodeEditor instance in selected UI session.',
        inputSchema: {
          type: 'object',
          properties: { sessionId: sessionIdProp, editorUid: editorUidProp },
          required: ['editorUid'],
        },
      },
      {
        name: 'nocobase.editors.write',
        description: 'Write code into a CodeEditor instance in selected UI session.',
        inputSchema: {
          type: 'object',
          properties: { sessionId: sessionIdProp, editorUid: editorUidProp, code: { type: 'string' } },
          required: ['editorUid', 'code'],
        },
      },
      {
        name: 'nocobase.flowContext.getApiInfos',
        description: 'Get FlowContext API infos (RunJS docs + defineProperty/defineMethod info).',
        inputSchema: {
          type: 'object',
          properties: { sessionId: sessionIdProp, editorUid: editorUidProp, pageUid: pageUidProp, options: {} },
        },
      },
      {
        name: 'nocobase.flowContext.getEnvInfos',
        description: 'Get runtime environment snapshot for FlowContext.',
        inputSchema: {
          type: 'object',
          properties: { sessionId: sessionIdProp, editorUid: editorUidProp, pageUid: pageUidProp },
        },
      },
      {
        name: 'nocobase.flowContext.getVarInfos',
        description: 'Get FlowContext variable meta infos (ctx meta tree roots).',
        inputSchema: {
          type: 'object',
          properties: { sessionId: sessionIdProp, editorUid: editorUidProp, pageUid: pageUidProp, options: {} },
        },
      },
      {
        name: 'nocobase.flowContext.getVar',
        description: 'Resolve a ctx expression value by path (expression starts with "ctx.").',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: sessionIdProp,
            editorUid: editorUidProp,
            pageUid: pageUidProp,
            path: { type: 'string' },
          },
          required: ['path'],
        },
      },
      {
        name: 'nocobase.flowContext.previewRunJS',
        description: 'Preview/diagnose a RunJS snippet (lint + sandbox execution) in selected UI session.',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: sessionIdProp,
            editorUid: editorUidProp,
            pageUid: pageUidProp,
            code: { type: 'string' },
          },
          required: ['code'],
        },
      },
      {
        name: 'nocobase.ui.flowEngine.getModel',
        description: 'Get a FlowModel snapshot (serialize) from UI FlowEngine.',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: sessionIdProp,
            editorUid: editorUidProp,
            pageUid: pageUidProp,
            uid: { type: 'string' },
            global: { type: 'boolean' },
          },
          required: ['uid'],
        },
      },
      {
        name: 'nocobase.ui.flowEngine.createSubModel',
        description: 'Create a sub model in UI FlowEngine (optionally persist).',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: sessionIdProp,
            editorUid: editorUidProp,
            pageUid: pageUidProp,
            parentUid: { type: 'string' },
            subKey: { type: 'string' },
            subType: { type: 'string', enum: ['array', 'object'] },
            model: { type: 'object' },
            insertBeforeUid: { type: 'string' },
            insertAfterUid: { type: 'string' },
            persist: { type: 'boolean' },
          },
          required: ['parentUid', 'subKey', 'subType', 'model'],
        },
      },
      {
        name: 'nocobase.ui.flowEngine.moveModel',
        description: 'Move a model relative to another model in UI FlowEngine (optionally persist).',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: sessionIdProp,
            editorUid: editorUidProp,
            pageUid: pageUidProp,
            sourceUid: { type: 'string' },
            targetUid: { type: 'string' },
            persist: { type: 'boolean' },
          },
          required: ['sourceUid', 'targetUid'],
        },
      },
      {
        name: 'nocobase.ui.flowEngine.destroyModel',
        description:
          'Destroy/remove a model in UI FlowEngine (persist=true uses repository destroy; persist=false only removes locally).',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: sessionIdProp,
            editorUid: editorUidProp,
            pageUid: pageUidProp,
            uid: { type: 'string' },
            persist: { type: 'boolean' },
          },
          required: ['uid'],
        },
      },
      {
        name: 'nocobase.db.flowModels.findOne',
        description: 'DB mode: load a flow model tree by uid.',
        inputSchema: {
          type: 'object',
          properties: {
            uid: { type: 'string' },
            includeAsyncNode: { type: 'boolean' },
            dataSourceKey: { type: 'string' },
          },
          required: ['uid'],
        },
      },
      {
        name: 'nocobase.db.flowModels.save',
        description: 'DB mode: upsert a flow model tree (model object).',
        inputSchema: {
          type: 'object',
          properties: { model: { type: 'object' }, dataSourceKey: { type: 'string' } },
          required: ['model'],
        },
      },
      {
        name: 'nocobase.db.flowModels.destroy',
        description: 'DB mode: remove a flow model by uid.',
        inputSchema: {
          type: 'object',
          properties: { uid: { type: 'string' }, dataSourceKey: { type: 'string' } },
          required: ['uid'],
        },
      },
      {
        name: 'nocobase.db.flowModels.move',
        description: 'DB mode: move a model relative to another model by uid.',
        inputSchema: {
          type: 'object',
          properties: {
            sourceId: { type: 'string' },
            targetId: { type: 'string' },
            position: { type: 'string', enum: ['before', 'after'] },
            dataSourceKey: { type: 'string' },
          },
          required: ['sourceId', 'targetId', 'position'],
        },
      },
      {
        name: 'nocobase.db.flowModels.duplicate',
        description: 'DB mode: duplicate a model tree by uid.',
        inputSchema: {
          type: 'object',
          properties: { uid: { type: 'string' }, dataSourceKey: { type: 'string' } },
          required: ['uid'],
        },
      },
      {
        name: 'nocobase.db.flowModels.attach',
        description: 'DB mode: attach a model under a parent (subKey/subType) at a position.',
        inputSchema: {
          type: 'object',
          properties: {
            uid: { type: 'string' },
            parentId: { type: 'string' },
            subKey: { type: 'string' },
            subType: { type: 'string', enum: ['array', 'object'] },
            position: { type: 'string' },
            dataSourceKey: { type: 'string' },
          },
          required: ['uid', 'parentId', 'subKey', 'subType'],
        },
      },
      {
        name: 'nocobase.db.sql.query',
        description: 'DB mode: run SQL via db.runSQL (dangerous, root).',
        inputSchema: {
          type: 'object',
          properties: {
            sql: { type: 'string' },
            bind: {},
            type: { type: 'string' },
            filter: {},
            dataSourceKey: { type: 'string' },
          },
          required: ['sql'],
        },
      },
      {
        name: 'nocobase.db.repository.call',
        description: 'DB mode: call a collection repository method (find/findOne/create/update/destroy/count).',
        inputSchema: {
          type: 'object',
          properties: {
            collection: { type: 'string' },
            method: { type: 'string' },
            args: {},
            dataSourceKey: { type: 'string' },
          },
          required: ['collection', 'method'],
        },
      },
      {
        name: 'nocobase.server.resource.call',
        description: 'Call an existing NocoBase resource action handler (root role).',
        inputSchema: {
          type: 'object',
          properties: {
            resource: { type: 'string' },
            action: { type: 'string' },
            params: {},
            values: {},
            headers: {},
          },
          required: ['resource', 'action'],
        },
      },
      {
        name: 'nocobase.ui.reload',
        description: 'Reload selected UI session (window.location.reload).',
        inputSchema: { type: 'object', properties: { sessionId: sessionIdProp } },
      },
    ];
  }

  private async callTool(conn: McpConnection, toolName: string, args: Record<string, any>) {
    switch (toolName) {
      case 'nocobase.sessions.list': {
        const sessions = Array.from(this.uiSessions.values())
          .sort((a, b) => b.lastSeenAt - a.lastSeenAt)
          .map((s) => ({
            sessionId: s.sessionId,
            url: s.url,
            ts: s.ts,
            lastSeenAt: s.lastSeenAt,
          }));
        return {
          sessions,
          selectedSessionId: conn.selectedUiSessionId,
        };
      }
      case 'nocobase.sessions.select': {
        const sessionId = String(args?.sessionId || '').trim();
        if (!sessionId) throw new Error('sessions.select: sessionId is required');
        if (!this.uiSessions.has(sessionId)) {
          throw new Error(`sessions.select: sessionId not found: ${sessionId}`);
        }
        conn.selectedUiSessionId = sessionId;
        this.mcpConnections.set(conn.mcpSessionId, conn);
        return { ok: true, selectedSessionId: sessionId };
      }

      case 'nocobase.pages.list':
        return this.callFrontend(conn, 'pages.list', args);

      case 'nocobase.editors.list':
        return this.callFrontend(conn, 'editors.list', args);
      case 'nocobase.editors.read':
        return this.callFrontend(conn, 'editors.read', args);
      case 'nocobase.editors.write':
        return this.callFrontend(conn, 'editors.write', args);

      case 'nocobase.flowContext.getApiInfos':
        return this.callFrontend(conn, 'flowContext.getApiInfos', args);
      case 'nocobase.flowContext.getEnvInfos':
        return this.callFrontend(conn, 'flowContext.getEnvInfos', args);
      case 'nocobase.flowContext.getVarInfos':
        return this.callFrontend(conn, 'flowContext.getVarInfos', args);
      case 'nocobase.flowContext.getVar':
        return this.callFrontend(conn, 'flowContext.getVar', args);
      case 'nocobase.flowContext.previewRunJS':
        return this.callFrontend(conn, 'flowContext.previewRunJS', args);

      case 'nocobase.ui.flowEngine.getModel':
        return this.callFrontend(conn, 'ui.flowEngine.getModel', args);
      case 'nocobase.ui.flowEngine.createSubModel':
        return this.callFrontend(conn, 'ui.flowEngine.createSubModel', args);
      case 'nocobase.ui.flowEngine.moveModel':
        return this.callFrontend(conn, 'ui.flowEngine.moveModel', args);
      case 'nocobase.ui.flowEngine.destroyModel':
        return this.callFrontend(conn, 'ui.flowEngine.destroyModel', args);

      case 'nocobase.ui.reload':
        await this.callFrontend(conn, 'ui.reload', args);
        return { ok: true };

      case 'nocobase.db.flowModels.findOne':
        return await this.dbFlowModelsFindOne(args);
      case 'nocobase.db.flowModels.save':
        return await this.dbFlowModelsSave(args);
      case 'nocobase.db.flowModels.destroy':
        return await this.dbFlowModelsDestroy(args);
      case 'nocobase.db.flowModels.move':
        return await this.dbFlowModelsMove(args);
      case 'nocobase.db.flowModels.duplicate':
        return await this.dbFlowModelsDuplicate(args);
      case 'nocobase.db.flowModels.attach':
        return await this.dbFlowModelsAttach(args);

      case 'nocobase.db.sql.query':
        return await this.dbSqlQuery(args);
      case 'nocobase.db.repository.call':
        return await this.dbRepositoryCall(args);

      case 'nocobase.server.resource.call':
        return await this.serverResourceCall(args);

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  private async callFrontend(conn: McpConnection, method: string, params: Record<string, any>) {
    const overrideSessionId = params?.sessionId ? String(params.sessionId) : undefined;
    const sessionId = overrideSessionId || conn.selectedUiSessionId || this.getDefaultUiSessionId();
    if (!sessionId) {
      throw new Error('No active UI session. Open a NocoBase page with plugin-mcp client loaded.');
    }
    if (!this.uiSessions.has(sessionId)) {
      throw new Error(`UI session not found: ${sessionId}`);
    }

    conn.selectedUiSessionId = sessionId;
    this.mcpConnections.set(conn.mcpSessionId, conn);

    const cleanParams = { ...(params || {}) };
    delete (cleanParams as any).sessionId;

    const requestId = randomUUID();
    const message = {
      type: 'mcp:request',
      payload: {
        requestId,
        method,
        params: cleanParams,
      },
    };

    const result = await new Promise<any>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingFrontendRpc.delete(requestId);
        reject(new Error(`Frontend RPC timeout (${FRONTEND_RPC_TIMEOUT_MS}ms): ${method}`));
      }, FRONTEND_RPC_TIMEOUT_MS);

      this.pendingFrontendRpc.set(requestId, {
        requestId,
        clientId: sessionId,
        timer,
        resolve,
        reject,
      });

      this.app.emit('ws:sendToClient', {
        clientId: sessionId,
        message,
      });
    });

    const prev = this.uiSessions.get(sessionId);
    if (prev) {
      prev.lastSeenAt = Date.now();
      this.uiSessions.set(sessionId, prev);
    }

    return result;
  }

  private getDatabaseByDataSourceKey(dataSourceKey = 'main'): Database {
    const dataSource = this.app.dataSourceManager.get(dataSourceKey);
    const cm = dataSource.collectionManager as SequelizeCollectionManager;
    if (!cm.db) {
      throw new Error(`No db for dataSourceKey: ${dataSourceKey}`);
    }
    return cm.db as Database;
  }

  private async dbFlowModelsFindOne(args: any) {
    const uid = String(args?.uid || '').trim();
    const dataSourceKey = args?.dataSourceKey ? String(args.dataSourceKey) : 'main';
    const includeAsyncNode = args?.includeAsyncNode === true;
    const db = this.getDatabaseByDataSourceKey(dataSourceKey);
    const repo: any = db.getRepository('flowModels');
    return await repo.findModelById(uid, { includeAsyncNode });
  }

  private async dbFlowModelsSave(args: any) {
    const model = args?.model;
    const dataSourceKey = args?.dataSourceKey ? String(args.dataSourceKey) : 'main';
    const db = this.getDatabaseByDataSourceKey(dataSourceKey);
    const repo: any = db.getRepository('flowModels');
    const uid = await repo.upsertModel(model);
    return { uid, model: await repo.findModelById(uid, { includeAsyncNode: true }) };
  }

  private async dbFlowModelsDestroy(args: any) {
    const uid = String(args?.uid || '').trim();
    const dataSourceKey = args?.dataSourceKey ? String(args.dataSourceKey) : 'main';
    const db = this.getDatabaseByDataSourceKey(dataSourceKey);
    const repo: any = db.getRepository('flowModels');
    return await repo.remove(uid);
  }

  private async dbFlowModelsMove(args: any) {
    const sourceId = String(args?.sourceId || '').trim();
    const targetId = String(args?.targetId || '').trim();
    const position = String(args?.position || '').trim();
    const dataSourceKey = args?.dataSourceKey ? String(args.dataSourceKey) : 'main';
    const db = this.getDatabaseByDataSourceKey(dataSourceKey);
    const repo: any = db.getRepository('flowModels');
    return await repo.move({ sourceId, targetId, position });
  }

  private async dbFlowModelsDuplicate(args: any) {
    const uid = String(args?.uid || '').trim();
    const dataSourceKey = args?.dataSourceKey ? String(args.dataSourceKey) : 'main';
    const db = this.getDatabaseByDataSourceKey(dataSourceKey);
    const repo: any = db.getRepository('flowModels');
    return await repo.duplicate(uid);
  }

  private async dbFlowModelsAttach(args: any) {
    const uid = String(args?.uid || '').trim();
    const parentId = String(args?.parentId || '').trim();
    const subKey = String(args?.subKey || '').trim();
    const subType = String(args?.subType || '').trim();
    const position = args?.position ? String(args.position) : undefined;
    const dataSourceKey = args?.dataSourceKey ? String(args.dataSourceKey) : 'main';
    const db = this.getDatabaseByDataSourceKey(dataSourceKey);
    const repo: any = db.getRepository('flowModels');
    return await repo.attach(uid, { parentId, subKey, subType, position });
  }

  private async dbSqlQuery(args: any) {
    const sql = String(args?.sql || '');
    const dataSourceKey = args?.dataSourceKey ? String(args.dataSourceKey) : 'main';
    const db = this.getDatabaseByDataSourceKey(dataSourceKey);
    const bind = typeof args?.bind !== 'undefined' ? args.bind : undefined;
    const type = typeof args?.type !== 'undefined' ? args.type : undefined;
    const filter = typeof args?.filter !== 'undefined' ? args.filter : undefined;
    return await db.runSQL(sql, { bind, type, filter });
  }

  private async dbRepositoryCall(args: any) {
    const collection = String(args?.collection || '').trim();
    const method = String(args?.method || '').trim();
    const dataSourceKey = args?.dataSourceKey ? String(args.dataSourceKey) : 'main';
    const db = this.getDatabaseByDataSourceKey(dataSourceKey);
    const repo: any = db.getRepository(collection);
    const fn = repo?.[method];
    if (typeof fn !== 'function') {
      throw new Error(`Repository method not found: ${collection}.${method}`);
    }
    const callArgs = args?.args;
    if (Array.isArray(callArgs)) {
      return await fn.apply(repo, callArgs);
    }
    return await fn.call(repo, callArgs);
  }

  private async serverResourceCall(args: any) {
    let resource = String(args?.resource || '').trim();
    let action = String(args?.action || '').trim();
    const params = typeof args?.params !== 'undefined' ? args.params : {};
    const values = typeof args?.values !== 'undefined' ? args.values : {};
    const headers = typeof args?.headers !== 'undefined' ? args.headers : {};

    if (!resource || !action) throw new Error('server.resource.call: resource/action are required');
    if (action.includes(':') && action.startsWith(`${resource}:`)) {
      action = action.slice(resource.length + 1);
    }
    if (!resource && action.includes(':')) {
      const [r, a] = action.split(':');
      resource = r;
      action = a;
    }

    const act: any = this.app.resourcer.getAction(resource, action).clone();

    const ctx: any = {
      app: this.app,
      db: this.app.db,
      cache: this.app.cache,
      i18n: this.app.i18n,
      state: {
        currentRole: 'root',
        currentRoles: ['root'],
        currentUser: { id: 0, nickname: 'root' },
      },
      request: {
        body: values,
        headers,
        method: 'POST',
        path: `/api/mcp/resource/${resource}/${action}`,
      },
      get(headerName: string) {
        const key = String(headerName || '').toLowerCase();
        const map = headers || {};
        for (const k of Object.keys(map)) {
          if (String(k).toLowerCase() === key) return map[k];
        }
        return '';
      },
      throw(status: number, body: any) {
        const err: any = new Error(typeof body === 'string' ? body : body?.message || 'Request error');
        err.status = status;
        err.body = body;
        throw err;
      },
    };

    act.setContext(ctx);
    act.actionName = action;
    act.resourceName = resource;
    act.mergeParams({ ...(params || {}), values });
    ctx.action = act;

    await act.execute(ctx, async () => {});

    return {
      status: ctx.status,
      body: ctx.body,
    };
  }
}
