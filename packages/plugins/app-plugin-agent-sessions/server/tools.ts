/**
 * The application's tools for the agents in sessions, served as an MCP server over HTTP: the streamable HTTP
 * transport without sessions or streams, each request answered with JSON. It is a protocol endpoint rather than an
 * `/api` route, so it answers JSON-RPC as MCP requires.
 *
 * The agent authenticates with its session's tools token, which the bridge hands it when the session opens:
 * `<sessionId>.<HMAC>`, signed with a key the application's secrets derive for this purpose. It reaches only that
 * session, for as long as the session is not archived, and a call runs as the session's owner.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

import { Hono, type Context } from 'hono';
import { z } from 'zod';

/** One tool the agents in sessions may call. */
export interface SessionTool<Input = unknown> {
  /** `snake_case`, unique among the application's tools. */
  readonly name: string;
  /** What the tool does and when to use it, for the agent. */
  readonly description: string;
  readonly input: z.ZodType<Input>;
  /** Runs the call as the session's owner; what it answers goes back to the agent as JSON. */
  readonly run: (input: Input, context: SessionToolContext) => Promise<unknown>;
}

/** Who calls a tool: the session's owner, in one of their sessions. */
export interface ToolCaller {
  readonly userId: string;
  readonly sessionId: string;
  /** The project the session works for, when its owner chose one; a tool that files work defaults to it. */
  readonly projectId: string | null;
}

export interface SessionToolContext extends ToolCaller {
  /** Ties a record to the session: the session shows it, and its owner can start its work from there. */
  readonly link: (kind: string, refId: string) => Promise<void>;
}

/** `tool` with its input type erased, for a list of tools of different inputs. */
export function defineSessionTool<Input>(
  tool: SessionTool<Input>,
): SessionTool {
  return tool as SessionTool;
}

/** Where agents reach the tools, under the application's base path. */
export const TOOLS_PATH = '/mcp/agent-sessions';

export interface ToolTokens {
  sign(sessionId: string): string;
  /** The session a token was signed for, or undefined for a token this application did not sign. */
  verify(token: string): string | undefined;
}

/** Tokens signed with the first of `keys` and accepted with any of them, so a rotated key keeps working until removed. */
export function createToolTokens(
  keys: () => readonly { readonly value: string }[],
): ToolTokens {
  const mac = (key: string, sessionId: string): Buffer =>
    createHmac('sha256', key).update(sessionId).digest();
  return {
    sign(sessionId) {
      const [current] = keys();
      if (!current)
        throw new Error(
          'No secrets key is configured to sign tool tokens with.',
        );
      return `${sessionId}.${mac(current.value, sessionId).toString('base64url')}`;
    },
    verify(token) {
      const dot = token.lastIndexOf('.');
      if (dot <= 0) return undefined;
      const sessionId = token.slice(0, dot);
      const given = Buffer.from(token.slice(dot + 1), 'base64url');
      const valid = keys().some((key) => {
        const expected = mac(key.value, sessionId);
        return (
          expected.length === given.length && timingSafeEqual(expected, given)
        );
      });
      return valid ? sessionId : undefined;
    },
  };
}

/** What the MCP endpoint needs from the service. */
export interface ToolHost {
  readonly serverName: string;
  tools(): readonly SessionTool[];
  /** The session's owner and the session a token belongs to, while the session takes calls. */
  caller(token: string): Promise<ToolCaller | undefined>;
  /** What the agent should know of its session before it calls a tool, such as its project. */
  instructions(caller: ToolCaller): Promise<string | undefined>;
  link(sessionId: string, kind: string, refId: string): Promise<void>;
}

const PROTOCOL_VERSIONS = ['2025-06-18', '2025-03-26', '2024-11-05'];

const RequestSchema = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.union([z.string(), z.number()]).optional(),
  method: z.string(),
  params: z.record(z.string(), z.unknown()).optional(),
});

type JsonRpcId = string | number | null;
type Answer = { jsonrpc: '2.0'; id: JsonRpcId } & (
  { result: unknown } | { error: { code: number; message: string } }
);

export function toolRoutes(host: ToolHost): Hono {
  const router = new Hono();
  router.post(TOOLS_PATH, async (context) => {
    const token = /^Bearer (.+)$/u.exec(
      context.req.header('authorization') ?? '',
    )?.[1];
    const caller = token ? await host.caller(token) : undefined;
    if (!caller) return unauthorized(context);
    let body: unknown;
    try {
      body = await context.req.json();
    } catch {
      return context.json(
        failure(null, -32700, 'The request is not JSON.'),
        400,
      );
    }
    const messages = Array.isArray(body) ? body : [body];
    const answers = (
      await Promise.all(
        messages.map((message) => answer(host, caller, message)),
      )
    ).filter((entry): entry is Answer => entry !== undefined);
    if (answers.length === 0) return context.body(null, 202);
    return context.json(Array.isArray(body) ? answers : answers[0]);
  });
  // No server-sent event stream and no protocol sessions: only POST is served.
  router.on(['GET', 'DELETE'], TOOLS_PATH, (context) =>
    context.body(null, 405, { Allow: 'POST' }),
  );
  return router;
}

async function answer(
  host: ToolHost,
  caller: ToolCaller,
  message: unknown,
): Promise<Answer | undefined> {
  const parsed = RequestSchema.safeParse(message);
  if (!parsed.success)
    return failure(null, -32600, 'The message is not a JSON-RPC 2.0 request.');
  const { id, method, params } = parsed.data;
  // A notification, such as `notifications/initialized`, is taken without an answer.
  if (id === undefined) return undefined;
  switch (method) {
    case 'initialize': {
      const asked =
        typeof params?.protocolVersion === 'string'
          ? params.protocolVersion
          : '';
      const instructions = await host.instructions(caller);
      return success(id, {
        protocolVersion: PROTOCOL_VERSIONS.includes(asked)
          ? asked
          : PROTOCOL_VERSIONS[0],
        capabilities: { tools: {} },
        // The version of this tool surface, not of the application.
        serverInfo: { name: host.serverName, version: '1' },
        ...(instructions ? { instructions } : {}),
      });
    }
    case 'ping':
      return success(id, {});
    case 'tools/list':
      return success(id, {
        tools: host.tools().map((tool) => ({
          name: tool.name,
          description: tool.description,
          inputSchema: z.toJSONSchema(tool.input, { io: 'input' }),
        })),
      });
    case 'tools/call': {
      const tool = host
        .tools()
        .find((candidate) => candidate.name === params?.name);
      if (!tool)
        return failure(
          id,
          -32602,
          `There is no tool named ${String(params?.name)}.`,
        );
      const input = tool.input.safeParse(params?.arguments ?? {});
      if (!input.success)
        return success(id, toolError(z.prettifyError(input.error)));
      try {
        const output = await tool.run(input.data, {
          ...caller,
          link: (kind, refId) => host.link(caller.sessionId, kind, refId),
        });
        return success(id, {
          content: [
            { type: 'text', text: JSON.stringify(output ?? null, null, 2) },
          ],
        });
      } catch (error) {
        return success(
          id,
          toolError(error instanceof Error ? error.message : String(error)),
        );
      }
    }
    default:
      return failure(id, -32601, `The method ${method} is not supported.`);
  }
}

/** A failed call, which the agent reads and can correct, as MCP reports tool failures. */
function toolError(message: string): {
  content: { type: 'text'; text: string }[];
  isError: true;
} {
  return { content: [{ type: 'text', text: message }], isError: true };
}

function success(id: JsonRpcId, result: unknown): Answer {
  return { jsonrpc: '2.0', id, result };
}

function failure(id: JsonRpcId, code: number, message: string): Answer {
  return { jsonrpc: '2.0', id, error: { code, message } };
}

function unauthorized(context: Context): Response {
  return context.json(
    failure(
      null,
      -32001,
      'The tools token is missing, not valid, or its session is archived.',
    ),
    401,
    {
      'WWW-Authenticate': 'Bearer',
    },
  );
}
