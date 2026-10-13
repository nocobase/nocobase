import { describe, expect, it } from 'vitest';

import { foldTranscript, toolSummary } from '../../client/transcript.js';
import type { TranscriptEvent } from '../../shared/api.js';

const at = (second: number) =>
  `2026-10-13T08:00:${String(second).padStart(2, '0')}.000Z`;

function events(...list: Record<string, unknown>[]): TranscriptEvent[] {
  return list.map(
    (event, index) =>
      ({ at: at(index), seq: index + 1, ...event }) as TranscriptEvent,
  );
}

const prompt = (promptId: string, text: string) => ({
  kind: 'prompt',
  promptId,
  content: [{ type: 'text', text }],
});
const update = (fields: Record<string, unknown>) => ({
  kind: 'update',
  update: fields,
});
const message = (text: string, messageId = 'm1') =>
  update({
    sessionUpdate: 'agent_message_chunk',
    messageId,
    content: { type: 'text', text },
  });
const ended = (promptId: string, extra: Record<string, unknown> = {}) => ({
  kind: 'turnEnded',
  promptId,
  stopReason: 'end_turn',
  usage: null,
  error: null,
  ...extra,
});

describe('foldTranscript', () => {
  it('shows a turn as the prompt, one message and how it ended', () => {
    const items = foldTranscript(
      events(
        prompt('p1', 'hi'),
        { kind: 'turnStarted', promptId: 'p1' },
        message('Hel'),
        message('lo'),
        message('Again', 'm2'),
        ended('p1'),
      ),
    );
    expect(items).toMatchObject([
      { type: 'prompt', text: 'hi', state: 'done' },
      { type: 'message', text: 'Hello' },
      { type: 'message', text: 'Again' },
      { type: 'turn', stopReason: 'end_turn', seconds: 4 },
    ]);
  });

  it('tells a queued prompt from a running, cancelled or failed one', () => {
    const states = (list: Record<string, unknown>[]) =>
      foldTranscript(events(...list)).flatMap((item) =>
        item.type === 'prompt' ? [item.state] : [],
      );
    expect(
      states([
        prompt('p1', 'a'),
        { kind: 'turnStarted', promptId: 'p1' },
        prompt('p2', 'b'),
      ]),
    ).toEqual(['running', 'queued']);
    expect(
      states([prompt('p1', 'a'), ended('p1', { stopReason: 'cancelled' })]),
    ).toEqual(['cancelled']);
    expect(
      states([
        prompt('p1', 'a'),
        ended('p1', { stopReason: null, error: 'Codex is not signed in.' }),
      ]),
    ).toEqual(['failed']);
  });

  it('groups consecutive tool calls and follows each call’s updates', () => {
    const items = foldTranscript(
      events(
        update({
          sessionUpdate: 'tool_call',
          toolCallId: 't1',
          title: 'ls',
          kind: 'execute',
          status: 'in_progress',
        }),
        update({
          sessionUpdate: 'tool_call_update',
          toolCallId: 't1',
          status: 'completed',
          _meta: { terminal_output_delta: { data: 'a.txt\n' } },
        }),
        update({
          sessionUpdate: 'tool_call',
          toolCallId: 't2',
          title: 'Edit a.txt',
          kind: 'edit',
          content: [
            { type: 'diff', path: '/w/a.txt', oldText: 'a', newText: 'b' },
          ],
        }),
        update({
          sessionUpdate: 'tool_call',
          toolCallId: 't3',
          title: 'mcp.studio.create_issues',
          kind: 'execute',
        }),
        message('Done'),
      ),
    );
    expect(items).toHaveLength(2);
    const [tools] = items;
    expect(tools).toMatchObject({
      type: 'tools',
      calls: [
        { id: 't1', kind: 'execute', status: 'completed', output: 'a.txt\n' },
        {
          id: 't2',
          kind: 'edit',
          diffs: [{ path: '/w/a.txt', oldText: 'a', newText: 'b' }],
        },
        { id: 't3', kind: 'other' },
      ],
    });
    expect(tools?.type === 'tools' && toolSummary(tools.calls)).toEqual([
      { kind: 'execute', count: 1 },
      { kind: 'edit', count: 1 },
      { kind: 'other', count: 1 },
    ]);
  });

  it('settles a permission request with its answer', () => {
    const items = foldTranscript(
      events(
        {
          kind: 'permissionRequested',
          requestId: 'r1',
          toolCall: {
            title: 'Run rm',
            rawInput: { command: ['rm', '-rf', 'build'] },
          },
          options: [],
        },
        {
          kind: 'permissionResolved',
          requestId: 'r1',
          optionId: null,
          reason: 'answered',
        },
      ),
    );
    expect(items).toMatchObject([
      {
        type: 'permission',
        title: 'Run rm',
        detail: 'rm -rf build',
        outcome: 'declined',
      },
    ]);
  });

  it('keeps the latest plan and shows the records a turn made after it', () => {
    const plan = (status: string) =>
      update({
        sessionUpdate: 'plan',
        entries: [{ content: 'Write tests', status }, { content: '' }],
      });
    const items = foldTranscript(
      events(
        prompt('p1', 'plan it'),
        { kind: 'turnStarted', promptId: 'p1' },
        plan('pending'),
        plan('completed'),
        { kind: 'link', linkKind: 'issue', refId: 'ST-1' },
        { kind: 'link', linkKind: 'issue', refId: 'ST-2' },
        ended('p1'),
      ),
    );
    expect(items.map((item) => item.type)).toEqual([
      'prompt',
      'plan',
      'turn',
      'links',
    ]);
    expect(items[1]).toMatchObject({
      entries: [{ content: 'Write tests', status: 'completed' }],
    });
    expect(items[3]).toMatchObject({
      linkKind: 'issue',
      refIds: ['ST-1', 'ST-2'],
    });
  });

  it('leaves out updates it does not know', () => {
    expect(
      foldTranscript(
        events(update({ sessionUpdate: 'something_new', value: 1 })),
      ),
    ).toEqual([]);
  });
});
