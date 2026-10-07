/**
 * A scripted stand-in for `pi --mode rpc`. It parses the adapter's stdin as
 * JSONL commands and lets a test answer them and write events, using the
 * record shapes documented in @earendil-works/pi-coding-agent 0.99.2
 * (docs/rpc.md, docs/rpc-commands.md, docs/json.md, docs/rpc-extension-ui.md).
 */
import { EventEmitter } from 'node:events';
import { chmod, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { PassThrough } from 'node:stream';

import { PiAdapter } from '../../src/agent/adapters/pi.ts';
import type { PiProcess, SpawnFn } from '../../src/agent/adapters/pi.ts';
import { PERMISSION_COMMAND } from '../../src/agent/adapters/pi/extension.ts';

export type Command = { type: string; id?: string; [key: string]: unknown };

export class FakePi extends EventEmitter implements PiProcess {
  readonly stdin = new PassThrough();
  readonly stdout = new PassThrough();
  readonly stderr = new PassThrough();
  readonly commands: Command[] = [];
  readonly signals: string[] = [];
  readonly file: string;
  readonly args: string[];
  readonly options: { cwd: string; env: Record<string, string> };
  exited = false;
  private buffer = '';
  private waiters: { type: string; resolve: (c: Command) => void }[] = [];
  private untaken: Command[] = [];

  constructor(
    file: string,
    args: string[],
    options: { cwd: string; env: Record<string, string> },
  ) {
    super();
    this.file = file;
    this.args = args;
    this.options = options;
    this.stdin.on('data', (chunk: Buffer) => {
      this.buffer += String(chunk);
      let index = this.buffer.indexOf('\n');
      while (index !== -1) {
        const line = this.buffer.slice(0, index);
        this.buffer = this.buffer.slice(index + 1);
        const command = JSON.parse(line) as Command;
        this.commands.push(command);
        this.emit('command', command);
        const waiter = this.waiters.findIndex((w) => w.type === command.type);
        if (waiter !== -1) this.waiters.splice(waiter, 1)[0]!.resolve(command);
        else this.untaken.push(command);
        index = this.buffer.indexOf('\n');
      }
    });
  }

  /** Resolves with the next command of this type (or one already received and not yet taken). */
  next(type: string): Promise<Command> {
    const index = this.untaken.findIndex((c) => c.type === type);
    if (index !== -1) return Promise.resolve(this.untaken.splice(index, 1)[0]!);
    return new Promise((resolve) => this.waiters.push({ type, resolve }));
  }

  write(record: Record<string, unknown>): void {
    this.stdout.write(`${JSON.stringify(record)}\n`);
  }

  respond(
    command: Command,
    data?: Record<string, unknown>,
    success = true,
    error?: string,
  ): void {
    this.write({
      ...(command.id ? { id: command.id } : {}),
      type: 'response',
      command: command.type,
      success,
      ...(data ? { data } : {}),
      ...(error ? { error } : {}),
    });
  }

  exit(code = 0): void {
    if (this.exited) return;
    this.exited = true;
    this.stdout.end();
    this.stderr.end();
    setImmediate(() => this.emit('close', code));
  }

  kill(signal: NodeJS.Signals = 'SIGTERM'): boolean {
    this.signals.push(signal);
    this.exit(signal === 'SIGKILL' ? 137 : 143);
    return true;
  }
}

export interface FakeOptions {
  /** Answer the handshake (get_commands with the bridge, get_state). */
  bridge?: boolean;
  sessionId?: string;
  /** Exit when stdin closes, as Pi does. */
  exitOnStdinEnd?: boolean;
}

/** A spawn function that hands each fake process to `onSpawn`. */
export function fakeSpawn(
  onSpawn: (pi: FakePi) => void,
  options: FakeOptions = {},
): { spawn: SpawnFn; processes: FakePi[] } {
  const processes: FakePi[] = [];
  const spawn: SpawnFn = (file, args, opts) => {
    const pi = new FakePi(file, args, opts);
    processes.push(pi);
    if (options.exitOnStdinEnd !== false) pi.stdin.on('end', () => pi.exit(0));
    pi.on('command', (command: Command) => {
      if (command.type === 'get_commands') {
        pi.respond(command, {
          commands:
            options.bridge === false
              ? []
              : [
                  {
                    name: PERMISSION_COMMAND,
                    source: 'extension',
                    sourceInfo: { path: '/tmp/nocobase-runner-permission.ts' },
                  },
                ],
        });
      } else if (command.type === 'get_state') {
        pi.respond(command, {
          model: { id: 'claude-sonnet-4-5', provider: 'anthropic' },
          thinkingLevel: 'medium',
          isStreaming: false,
          sessionId: options.sessionId ?? 'pi-session-1',
          sessionFile: '/sessions/pi-session-1.jsonl',
        });
      }
    });
    onSpawn(pi);
    return pi;
  };
  return { spawn, processes };
}

export async function fakePiDir(): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), 'nocobase-runner-pi-bin-'));
  const bin = path.join(dir, 'pi');
  await writeFile(bin, '#!/bin/sh\n');
  await chmod(bin, 0o755);
  return dir;
}

export const MODELS_TABLE = [
  'provider   model              context  max-out  thinking  images',
  'anthropic  claude-sonnet-4-5  200K     64K      yes       yes',
].join('\n');

export async function adapterWith(
  spawn: SpawnFn,
  version = '0.99.2',
): Promise<PiAdapter> {
  return new PiAdapter({
    searchPath: await fakePiDir(),
    spawn,
    exec: (_file, args) =>
      Promise.resolve(
        args[0] === '--version'
          ? { code: 0, stdout: `${version}\n` }
          : { code: 0, stdout: MODELS_TABLE },
      ),
  });
}

// ---------------------------------------------------------------------------
// Event records (shapes from docs/json.md and docs/message-types.md)
// ---------------------------------------------------------------------------

export const usage = (input: number, output: number) => ({
  input,
  output,
  cacheRead: 10,
  cacheWrite: 5,
  totalTokens: input + output + 15,
  cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0.001 },
});

export function userMessage(text: string) {
  const message = { role: 'user', content: text, timestamp: 1733234401000 };
  return [
    { type: 'message_start', message },
    { type: 'message_end', message },
  ];
}

/** A steered user message, as Pi queues it (content blocks, not a string). */
export function steeredMessage(text: string) {
  const message = {
    role: 'user',
    content: [{ type: 'text', text }],
    timestamp: 1733234402000,
  };
  return [
    { type: 'message_start', message },
    { type: 'message_end', message },
  ];
}

export function assistantMessage(
  content: unknown[],
  options: {
    stopReason?: string;
    errorMessage?: string;
    input?: number;
    output?: number;
    model?: string;
  } = {},
) {
  const message = {
    role: 'assistant',
    content,
    api: 'anthropic-messages',
    provider: 'anthropic',
    model: options.model ?? 'claude-sonnet-4-5',
    usage: usage(options.input ?? 100, options.output ?? 20),
    stopReason: options.stopReason ?? 'stop',
    ...(options.errorMessage ? { errorMessage: options.errorMessage } : {}),
    timestamp: 1733234403000,
  };
  return [
    {
      type: 'message_start',
      message: { ...message, content: [], stopReason: 'pending' },
    },
    {
      type: 'message_update',
      usage: message.usage,
      assistantMessageEvent: {
        type: 'text_delta',
        contentIndex: 0,
        delta: 'x',
      },
    },
    { type: 'message_end', message },
  ];
}

export function toolCall(
  id: string,
  name: string,
  args: Record<string, unknown>,
) {
  return { type: 'toolCall', id, name, arguments: args };
}

export function toolExecution(
  id: string,
  name: string,
  args: Record<string, unknown>,
  output: string,
  isError = false,
) {
  return {
    start: {
      type: 'tool_execution_start',
      toolCallId: id,
      toolName: name,
      args,
    },
    end: {
      type: 'tool_execution_end',
      toolCallId: id,
      toolName: name,
      result: { content: [{ type: 'text', text: output }], details: {} },
      isError,
    },
  };
}

/** The `input` dialog the permission extension opens for one call. */
export function permissionRequest(
  id: string,
  toolCallId: string,
  toolName: string,
  input: Record<string, unknown>,
) {
  return {
    type: 'extension_ui_request',
    id,
    method: 'input',
    title: 'nocobase-runner-permission/v1',
    placeholder: JSON.stringify({ toolCallId, toolName, input }),
  };
}
