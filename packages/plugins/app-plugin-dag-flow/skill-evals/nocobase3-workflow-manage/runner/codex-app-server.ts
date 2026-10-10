import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import readline from 'node:readline';

import type { AgentRunOptions, AgentRunResult } from './types.js';

interface RpcResponse {
  id?: number;
  method?: string;
  result?: Record<string, unknown>;
  error?: { code?: number; message?: string };
  params?: Record<string, unknown>;
}

interface PendingRequest {
  resolve: (value: Record<string, unknown>) => void;
  reject: (error: Error) => void;
}

export class CodexAppServerAdapter {
  readonly name = 'codex-app-server';

  async run(options: AgentRunOptions): Promise<AgentRunResult> {
    const startedAt = Date.now();
    const child = spawn('codex', ['app-server', '--stdio'], {
      cwd: options.cwd,
      env: globalThis.process.env,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const client = new CodexRpcClient(child);
    try {
      await client.request('initialize', {
        clientInfo: {
          name: 'nocobase_workflow_skill_eval',
          title: 'NocoBase Workflow Skill Eval',
          version: '0.1.0',
        },
        capabilities: {
          optOutNotificationMethods: [
            'item/agentMessage/delta',
            'item/reasoning/summaryTextDelta',
            'item/reasoning/textDelta',
          ],
        },
      });
      client.notify('initialized', {});
      const threadResult = await client.request('thread/start', {
        ...(options.model ? { model: options.model } : {}),
        cwd: options.cwd,
        approvalPolicy: 'never',
        sandbox: options.sandbox,
        ephemeral: true,
      });
      const thread = threadResult.thread as { id?: string } | undefined;
      if (!thread?.id) throw new Error('Codex did not return a thread id.');
      const turnResult = await client.request('turn/start', {
        threadId: thread.id,
        input: [
          ...(options.injectSkill
            ? [
                {
                  type: 'skill',
                  name: 'nocobase-app-plugin-dag-flow',
                  path: options.skillPath,
                },
              ]
            : []),
          { type: 'text', text: options.prompt, text_elements: [] },
        ],
      });
      const turn = turnResult.turn as { id?: string } | undefined;
      if (!turn?.id) throw new Error('Codex did not return a turn id.');
      const completed = await client.waitForTurn(
        thread.id,
        turn.id,
        options.timeoutMs,
      );
      return {
        adapter: this.name,
        threadId: thread.id,
        turnId: turn.id,
        status: completed.status,
        finalResponse: completed.finalResponse,
        stderr: client.stderr,
        durationMs: Date.now() - startedAt,
      };
    } finally {
      await client.close();
    }
  }
}

class CodexRpcClient {
  private nextId = 1;
  private readonly pending = new Map<number, PendingRequest>();
  private readonly turnWaiters = new Map<
    string,
    {
      resolve: (value: { status: string; finalResponse: string }) => void;
      reject: (error: Error) => void;
      timer: NodeJS.Timeout;
    }
  >();
  private readonly finalResponses = new Map<string, string>();
  private readonly completedTurns = new Map<
    string,
    { status: string; finalResponse: string }
  >();
  private readonly lines: readline.Interface;
  private stderrChunks: string[] = [];

  constructor(private readonly process: ChildProcessWithoutNullStreams) {
    this.lines = readline.createInterface({ input: process.stdout });
    this.lines.on('line', (line) => this.onLine(line));
    process.stderr.on('data', (chunk: Buffer) => {
      this.stderrChunks.push(chunk.toString('utf8'));
    });
    process.once('error', (error) => this.failAll(error));
    process.once('exit', (code) => {
      if (code !== 0 && this.pending.size + this.turnWaiters.size > 0) {
        const stderr = this.stderr.trim();
        this.failAll(
          new Error(
            `Codex app-server exited with code ${String(code)}.${stderr ? `\n${stderr}` : ''}`,
          ),
        );
      }
    });
  }

  get stderr(): string {
    return this.stderrChunks.join('');
  }

  request(
    method: string,
    params: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const id = this.nextId++;
    this.send({ method, id, params });
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
  }

  notify(method: string, params: Record<string, unknown>): void {
    this.send({ method, params });
  }

  waitForTurn(
    threadId: string,
    turnId: string,
    timeoutMs: number,
  ): Promise<{ status: string; finalResponse: string }> {
    const key = `${threadId}:${turnId}`;
    const completed = this.completedTurns.get(key);
    if (completed) {
      this.completedTurns.delete(key);
      return Promise.resolve(completed);
    }
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.turnWaiters.delete(key);
        reject(new Error(`Codex turn timed out after ${timeoutMs}ms.`));
      }, timeoutMs);
      this.turnWaiters.set(key, { resolve, reject, timer });
    });
  }

  async close(): Promise<void> {
    this.lines.close();
    this.process.stdin.end();
    if (this.process.exitCode === null) this.process.kill('SIGTERM');
    await new Promise<void>((resolve) => {
      if (this.process.exitCode !== null) return resolve();
      const timer = setTimeout(() => {
        this.process.kill('SIGKILL');
        resolve();
      }, 2000);
      this.process.once('exit', () => {
        clearTimeout(timer);
        resolve();
      });
    });
  }

  private send(message: unknown): void {
    this.process.stdin.write(`${JSON.stringify(message)}\n`);
  }

  private onLine(line: string): void {
    let message: RpcResponse;
    try {
      message = JSON.parse(line) as RpcResponse;
    } catch {
      return;
    }
    if (message.id !== undefined && (message.result || message.error)) {
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (message.error) {
        pending.reject(
          new Error(
            `Codex RPC error ${String(message.error.code)}: ${message.error.message ?? 'unknown error'}`,
          ),
        );
      } else {
        pending.resolve(message.result ?? {});
      }
      return;
    }
    if (message.method === 'item/completed') {
      const item = message.params?.item as
        { type?: string; text?: string } | undefined;
      const turnId = message.params?.turnId;
      if (
        item?.type === 'agentMessage' &&
        typeof item.text === 'string' &&
        typeof turnId === 'string'
      ) {
        this.finalResponses.set(turnId, item.text);
      }
      return;
    }
    if (message.method === 'turn/completed') {
      const threadId = message.params?.threadId;
      const turn = message.params?.turn as
        { id?: string; status?: string } | undefined;
      if (typeof threadId !== 'string' || !turn?.id) return;
      const key = `${threadId}:${turn.id}`;
      const waiter = this.turnWaiters.get(key);
      const completed = {
        status: turn.status ?? 'unknown',
        finalResponse: this.finalResponses.get(turn.id) ?? '',
      };
      if (!waiter) {
        this.completedTurns.set(key, completed);
        return;
      }
      clearTimeout(waiter.timer);
      this.turnWaiters.delete(key);
      waiter.resolve(completed);
    }
  }

  private failAll(error: Error): void {
    for (const pending of this.pending.values()) pending.reject(error);
    this.pending.clear();
    for (const waiter of this.turnWaiters.values()) {
      clearTimeout(waiter.timer);
      waiter.reject(error);
    }
    this.turnWaiters.clear();
  }
}
