import { describe, expect, it } from 'vitest';

import {
  BridgeCommandSchema,
  coalesce,
  MAX_EVENT_TEXT,
  ReportRequestSchema,
  type BridgeEvent,
} from '../src/protocol.js';

const at = '2026-10-13T00:00:00.000Z';
const chunk = (text: string, messageId = 'm1'): BridgeEvent => ({
  kind: 'update',
  at,
  update: {
    sessionUpdate: 'agent_message_chunk',
    messageId,
    content: { type: 'text', text },
  },
});

describe('the wire protocol', () => {
  const session = {
    id: 'session-1',
    agentId: 'codex',
    cwd: '/home/zhou/code',
    acpSessionId: null,
    settings: { mode: 'agent-full-access' },
    tools: { name: 'studio', path: '/mcp/agent-sessions', token: 'abc.def' },
  };

  it('takes the commands it defines', () => {
    expect(
      BridgeCommandSchema.parse({
        type: 'prompt',
        session,
        promptId: 'p1',
        content: [{ type: 'text', text: 'hello' }],
      }),
    ).toMatchObject({ type: 'prompt' });
    expect(
      BridgeCommandSchema.safeParse({
        type: 'choose',
        session,
        choiceId: 'model',
        value: 'x',
      }).success,
    ).toBe(true);
  });

  it('refuses a tools path that is not a path of the application', () => {
    const tools = {
      ...session.tools,
      path: 'https://elsewhere.example.com/mcp',
    };
    expect(
      BridgeCommandSchema.safeParse({
        type: 'cancel',
        session: { ...session, tools },
      }).success,
    ).toBe(false);
  });

  it('refuses an update without its ACP kind', () => {
    const report = {
      computerId: 'c1',
      sessionId: 's1',
      batch: 1,
      bridgeStartedAt: at,
      state: null,
      events: [{ kind: 'update', at, update: { content: 'x' } }],
    };
    expect(ReportRequestSchema.safeParse(report).success).toBe(false);
  });
});

describe('coalesce', () => {
  it('joins the pieces of one streamed message', () => {
    expect(coalesce([chunk('Hel'), chunk('lo'), chunk('next', 'm2')])).toEqual([
      chunk('Hello'),
      chunk('next', 'm2'),
    ]);
  });

  it('keeps a message that would grow past the text limit apart', () => {
    const long = 'x'.repeat(MAX_EVENT_TEXT);
    expect(coalesce([chunk(long), chunk('y')])).toHaveLength(2);
  });

  it('joins the updates of one tool call, its streamed output included', () => {
    const update = (status: string, data: string): BridgeEvent => ({
      kind: 'update',
      at,
      update: {
        sessionUpdate: 'tool_call_update',
        toolCallId: 't1',
        status,
        _meta: { terminal_output_delta: { terminal_id: 't1', data } },
      },
    });
    const [joined] = coalesce([
      update('in_progress', 'a\n'),
      update('completed', 'b\n'),
    ]);
    expect(joined).toMatchObject({
      update: {
        status: 'completed',
        _meta: { terminal_output_delta: { terminal_id: 't1', data: 'a\nb\n' } },
      },
    });
  });

  it('leaves other events in their order', () => {
    const started: BridgeEvent = { kind: 'turnStarted', at, promptId: 'p1' };
    expect(coalesce([chunk('a'), started, chunk('b')])).toEqual([
      chunk('a'),
      started,
      chunk('b'),
    ]);
  });
});
