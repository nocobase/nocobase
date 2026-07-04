/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { readFile } from 'fs/promises';
import path from 'path';

import { codexAdapter, parseCodexJsonlLine } from '../adapters/codex';

describe('Codex agent adapter', () => {
  it('declares the initial Codex capabilities', () => {
    expect(codexAdapter.provider).toBe('codex');
    expect(codexAdapter.capabilities).toEqual({
      structuredEvents: true,
      terminalOutput: true,
      resumeSession: true,
      detectSessionId: true,
      resumeWithMessage: true,
      liveSemanticMessage: false,
      stdinMessage: false,
      interrupt: true,
      terminate: true,
      artifacts: true,
    });
  });

  it('builds start and resume commands as argv arrays', () => {
    expect(
      codexAdapter.buildStartCommand({
        prompt: 'Build a page',
        cwd: '/workspace',
      }),
    ).toMatchObject({
      commandKey: 'codex',
      args: ['exec', '--json', 'Build a page'],
      cwd: '/workspace',
    });
    expect(
      codexAdapter.buildResumeCommand({
        providerSessionId: '019f1e72-d75c-7c61-a9ba-cc99c653e0a2',
        message: 'Continue',
      }),
    ).toMatchObject({
      commandKey: 'codex',
      args: ['exec', 'resume', '--json', '019f1e72-d75c-7c61-a9ba-cc99c653e0a2', 'Continue'],
    });
  });

  it('builds terminal-friendly commands without JSONL flags', () => {
    expect(
      codexAdapter.buildStartCommand({
        prompt: 'Build a page',
        cwd: '/workspace',
        outputMode: 'terminal',
      }),
    ).toMatchObject({
      commandKey: 'codex',
      args: ['exec', 'Build a page'],
      cwd: '/workspace',
    });
    expect(
      codexAdapter.buildResumeCommand({
        providerSessionId: '019f1e72-d75c-7c61-a9ba-cc99c653e0a2',
        message: 'Continue',
        outputMode: 'terminal',
      }),
    ).toMatchObject({
      commandKey: 'codex',
      args: ['exec', 'resume', '019f1e72-d75c-7c61-a9ba-cc99c653e0a2', 'Continue'],
    });
  });

  it('keeps spaces, quotes, and newlines as one resume message argv element', () => {
    const message = 'Continue with spaces, "quotes", and a newline\nthen finish';
    const command = codexAdapter.buildResumeCommand({
      providerSessionId: '019f1e72-d75c-7c61-a9ba-cc99c653e0a2',
      message,
    });

    expect(command.args).toEqual(['exec', 'resume', '--json', '019f1e72-d75c-7c61-a9ba-cc99c653e0a2', message]);
    expect(command.args.at(-1)).toBe(message);
  });

  it('detects session ids from valid thread.started JSONL', () => {
    expect(
      codexAdapter.detectSessionId({
        rawLine: '{"type":"thread.started","thread_id":"thread-1"}',
      }),
    ).toBe('thread-1');
  });

  it('detects session ids from terminal-friendly Codex output', () => {
    const providerSessionId = '019f2d69-1199-7212-a3de-82e3870de7f9';
    expect(
      codexAdapter.detectSessionId({
        rawLine: `session id: ${providerSessionId}`,
      }),
    ).toBe(providerSessionId);
    expect(
      codexAdapter.normalizeEvent({
        rawLine: `session id: ${providerSessionId}`,
      }),
    ).toEqual([
      {
        eventType: 'agent.session.started',
        level: 'info',
        providerEventId: `session.id:${providerSessionId}`,
        message: providerSessionId,
        payloadJson: {
          providerSessionId,
        },
      },
    ]);
  });

  it('detects session ids from the real captured local Codex JSONL sample', async () => {
    const fixture = await readFile(path.join(__dirname, '../__fixtures__/codex-real-exec-jsonl.sample.jsonl'), 'utf8');
    const providerSessionIds = fixture
      .split(/\r?\n/)
      .map((rawLine) => codexAdapter.detectSessionId({ rawLine }))
      .filter(Boolean);

    expect(providerSessionIds).toHaveLength(1);
    expect(providerSessionIds[0]).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  it('ignores missing thread ids and malformed JSON safely', () => {
    expect(codexAdapter.detectSessionId({ rawLine: '{"type":"thread.started"}' })).toBeNull();
    expect(codexAdapter.detectSessionId({ rawLine: '{"type":"turn.started"}' })).toBeNull();
    expect(codexAdapter.detectSessionId({ rawLine: '{not-json' })).toBeNull();
    expect(parseCodexJsonlLine({ rawLine: '{not-json' })).toBeNull();
  });

  it('normalizes command execution and agent message events', () => {
    expect(
      codexAdapter.normalizeEvent({
        rawLine:
          '{"type":"item.completed","item":{"id":"item_1","type":"command_execution","command":"echo ok","aggregated_output":"ok\\n","exit_code":0,"status":"completed"}}',
      }),
    ).toEqual([
      {
        eventType: 'agent.command.completed',
        level: 'info',
        providerEventId: 'item.completed:item_1',
        correlationId: 'item_1',
        message: 'Command completed',
        payloadJson: {
          command: 'echo ok',
          status: 'completed',
          exitCode: 0,
        },
      },
    ]);
    expect(
      codexAdapter.normalizeEvent({
        rawLine: '{"type":"item.completed","item":{"id":"item_2","type":"agent_message","text":"Done"}}',
      }),
    ).toEqual([
      {
        eventType: 'agent.message',
        level: 'info',
        providerEventId: 'item.completed:item_2',
        correlationId: 'item_2',
        message: 'Done',
        payloadJson: {
          itemId: 'item_2',
        },
      },
    ]);
    expect(
      codexAdapter.normalizeEvent({
        rawLine:
          '{"type":"item.started","item":{"id":"item_3","type":"command_execution","command":"echo SECRET","aggregated_output":"","exit_code":null,"status":"in_progress"}}',
      }),
    ).toEqual([
      {
        eventType: 'agent.command.started',
        level: 'info',
        providerEventId: 'item.started:item_3',
        correlationId: 'item_3',
        message: 'Command started',
        payloadJson: {
          command: 'echo SECRET',
          status: 'in_progress',
          exitCode: null,
        },
      },
    ]);
  });
});
