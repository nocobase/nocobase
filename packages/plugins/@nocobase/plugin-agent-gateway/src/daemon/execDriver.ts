/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { spawn } from 'child_process';
import { createWriteStream, WriteStream } from 'fs';
import { promises as fs } from 'fs';
import path from 'path';
import { StringDecoder } from 'string_decoder';

export type ExecTerminalStatus = 'succeeded' | 'failed' | 'timeout' | 'canceled' | 'lease_lost';

export interface ExecCommandDefinition {
  commandKey: string;
  executable: string;
  baseArgs?: string[];
  allowedEnvKeys?: string[];
  defaultTimeoutMs?: number;
}

export type ExecCommandAllowlist = Record<string, ExecCommandDefinition> | ExecCommandDefinition[];

export interface ExecuteCommandOptions {
  definition: ExecCommandDefinition;
  args?: string[];
  cwd: string;
  workspaceRoot: string;
  env?: Record<string, string>;
  timeoutMs?: number;
  cancelSignal?: AbortSignal;
  leaseLostSignal?: AbortSignal;
  artifactDir?: string;
  maxInlineLogBytes?: number;
  maxOutputSpoolBytes?: number;
}

export interface ExecuteAllowlistedCommandOptions extends Omit<ExecuteCommandOptions, 'definition'> {
  commandKey: string;
  allowlist: ExecCommandAllowlist;
}

export interface PreparedCommandExecution {
  executable: string;
  args: string[];
  cwd: string;
  env: Record<string, string>;
  timeoutMs: number;
}

export interface ExecOutputRecord {
  text: string | null;
  sizeBytes: number;
  capturedBytes?: number;
  truncated?: boolean;
  artifactPath?: string;
}

export interface ExecDriverResult {
  status: ExecTerminalStatus;
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  stdout: ExecOutputRecord;
  stderr: ExecOutputRecord;
}

export const DEFAULT_EXEC_TIMEOUT_MS = 24 * 60 * 60 * 1000;
const DEFAULT_MAX_INLINE_LOG_BYTES = 64 * 1024;
export const MAX_RUN_OUTPUT_SPOOL_BYTES = 256 * 1024 * 1024;
const INHERITED_ENV_KEYS = ['PATH', 'HOME', 'TMPDIR', 'TEMP', 'TMP', 'SystemRoot', 'WINDIR'];

export function prependWorkspaceNodeBinToPath(cwd: string, basePath = '') {
  const localBin = path.join(cwd, 'node_modules', '.bin');
  const entries = basePath.split(path.delimiter).filter((entry) => entry && entry !== localBin);
  return [localBin, ...entries].join(path.delimiter);
}

class OutputSpoolBudget {
  private capturedBytes = 0;
  private stopped = false;

  constructor(private readonly maxBytes: number) {}

  capture(chunk: Buffer) {
    if (this.stopped) {
      return chunk.subarray(0, 0);
    }
    const remainingBytes = Math.max(0, this.maxBytes - this.capturedBytes);
    const captured = chunk.subarray(0, remainingBytes);
    this.capturedBytes += captured.byteLength;
    return captured;
  }

  stop() {
    this.stopped = true;
  }
}

class OutputCollector {
  private inlineChunks: Buffer[] = [];
  private artifactPath?: string;
  private writeStream?: WriteStream;
  private writeError: Error | null = null;
  private sizeBytes = 0;
  private capturedBytes = 0;
  private truncated = false;
  private droppedInline = false;

  constructor(
    private readonly options: {
      commandKey: string;
      streamName: 'stdout' | 'stderr';
      artifactDir?: string;
      maxInlineLogBytes: number;
      spoolBudget: OutputSpoolBudget;
      onWriteError(error: Error): void;
    },
  ) {}

  private failWrite(error: Error) {
    if (this.writeError) {
      return;
    }
    this.writeError = error;
    this.options.onWriteError(error);
  }

  private ensureArtifactStream() {
    if (this.writeStream || !this.options.artifactDir) {
      return this.writeStream;
    }
    this.artifactPath = path.join(
      this.options.artifactDir,
      `${this.options.commandKey}-${this.options.streamName}.log`,
    );
    this.writeStream = createWriteStream(this.artifactPath, {
      flags: 'w',
    });
    this.writeStream.on('error', (error) => this.failWrite(error));
    for (const chunk of this.inlineChunks) {
      this.writeStream.write(chunk);
    }
    this.inlineChunks = [];
    return this.writeStream;
  }

  write(rawChunk: unknown, pause?: () => void, resume?: () => void) {
    const chunk = Buffer.isBuffer(rawChunk) ? rawChunk : Buffer.from(String(rawChunk));
    this.sizeBytes += chunk.byteLength;
    if (this.writeError) {
      return;
    }
    const capturedChunk = this.options.spoolBudget.capture(chunk);
    if (capturedChunk.byteLength < chunk.byteLength) {
      this.truncated = true;
    }
    if (!capturedChunk.length) {
      return;
    }
    const shouldInline =
      !this.writeStream && this.capturedBytes + capturedChunk.byteLength <= this.options.maxInlineLogBytes;

    if (shouldInline) {
      this.inlineChunks.push(Buffer.from(capturedChunk));
      this.capturedBytes += capturedChunk.byteLength;
      return;
    }

    const stream = this.ensureArtifactStream();
    if (!stream) {
      this.inlineChunks = [];
      this.capturedBytes = 0;
      this.droppedInline = true;
      this.truncated = true;
      return;
    }

    this.capturedBytes += capturedChunk.byteLength;
    const canContinue = stream.write(capturedChunk);
    if (!canContinue && pause && resume) {
      pause();
      stream.once('drain', resume);
    }
  }

  async finish(): Promise<ExecOutputRecord> {
    if (this.writeStream) {
      if (this.writeError) {
        throw this.writeError;
      }
      await new Promise<void>((resolve, reject) => {
        const stream = this.writeStream;
        if (!stream) {
          resolve();
          return;
        }
        const cleanup = () => {
          stream.removeListener('finish', onFinish);
          stream.removeListener('error', onError);
        };
        const onFinish = () => {
          cleanup();
          resolve();
        };
        const onError = (error: Error) => {
          cleanup();
          reject(error);
        };
        stream.once('finish', onFinish);
        stream.once('error', onError);
        if (this.writeError) {
          onError(this.writeError);
          return;
        }
        stream.end();
      });
    }
    if (this.writeError) {
      throw this.writeError;
    }
    if (this.artifactPath) {
      return {
        text: null,
        sizeBytes: this.sizeBytes,
        capturedBytes: this.capturedBytes,
        truncated: this.truncated || this.capturedBytes < this.sizeBytes,
        artifactPath: this.artifactPath,
      };
    }
    if (this.droppedInline) {
      return {
        text: null,
        sizeBytes: this.sizeBytes,
        capturedBytes: 0,
        truncated: true,
      };
    }
    const decoder = new StringDecoder('utf8');
    return {
      text: `${this.inlineChunks.map((chunk) => decoder.write(chunk)).join('')}${decoder.end()}`,
      sizeBytes: this.sizeBytes,
      capturedBytes: this.capturedBytes,
      truncated: this.truncated || this.capturedBytes < this.sizeBytes,
    };
  }

  async cleanup() {
    this.writeStream?.destroy();
    if (this.artifactPath) {
      await fs.unlink(this.artifactPath).catch(() => {
        // Failed command output is not owned by the caller.
      });
    }
  }
}

function isWithin(parent: string, child: string) {
  const relative = path.relative(parent, child);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

async function resolveGuardedCwd(workspaceRoot: string, cwd: string) {
  const realRoot = await fs.realpath(workspaceRoot);
  const realCwd = await fs.realpath(cwd);
  if (!isWithin(realRoot, realCwd)) {
    throw new Error('cwd must stay inside the configured workspace root');
  }
  return realCwd;
}

function buildEnv(definition: ExecCommandDefinition, cwd: string, providedEnv: Record<string, string> = {}) {
  const allowedProvidedKeys = new Set(definition.allowedEnvKeys || []);
  const env: Record<string, string> = {};
  for (const key of INHERITED_ENV_KEYS) {
    if (process.env[key]) {
      env[key] = process.env[key];
    }
  }

  for (const [key, value] of Object.entries(providedEnv)) {
    if (!allowedProvidedKeys.has(key)) {
      throw new Error(`Environment variable is not allowlisted: ${key}`);
    }
    env[key] = value;
  }
  env.PATH = prependWorkspaceNodeBinToPath(cwd, env.PATH);
  return env;
}

export async function prepareCommandExecution(
  options: Pick<ExecuteCommandOptions, 'definition' | 'args' | 'cwd' | 'workspaceRoot' | 'env' | 'timeoutMs'>,
): Promise<PreparedCommandExecution> {
  const cwd = await resolveGuardedCwd(options.workspaceRoot, options.cwd);
  return {
    executable: options.definition.executable,
    args: [...(options.definition.baseArgs || []), ...(options.args || [])],
    cwd,
    env: buildEnv(options.definition, cwd, options.env),
    timeoutMs: options.timeoutMs || options.definition.defaultTimeoutMs || DEFAULT_EXEC_TIMEOUT_MS,
  };
}

function killProcess(child: ReturnType<typeof spawn>) {
  let closed = false;
  const pid = child.pid;
  child.once('close', () => {
    closed = true;
  });
  if (pid && process.platform === 'win32') {
    spawn('taskkill', ['/pid', String(pid), '/t', '/f'], {
      shell: false,
      stdio: 'ignore',
    });
  } else if (pid) {
    try {
      process.kill(-pid, 'SIGTERM');
    } catch {
      child.kill('SIGTERM');
    }
  } else {
    child.kill('SIGTERM');
  }
  const forceKillTimer = setTimeout(() => {
    if (!closed) {
      if (pid && process.platform !== 'win32') {
        try {
          process.kill(-pid, 'SIGKILL');
        } catch {
          child.kill('SIGKILL');
        }
      } else {
        child.kill('SIGKILL');
      }
    }
  }, 2000);
  child.once('close', () => {
    clearTimeout(forceKillTimer);
  });
}

export function getAllowlistedDefinition(allowlist: ExecCommandAllowlist, commandKey: string) {
  const definition = Array.isArray(allowlist)
    ? allowlist.find((item) => item.commandKey === commandKey)
    : allowlist[commandKey];
  if (!definition || definition.commandKey !== commandKey) {
    throw new Error(`Command is not allowlisted: ${commandKey}`);
  }
  return definition;
}

export async function executeCommand(options: ExecuteCommandOptions): Promise<ExecDriverResult> {
  const prepared = await prepareCommandExecution(options);
  const maxInlineLogBytes = options.maxInlineLogBytes || DEFAULT_MAX_INLINE_LOG_BYTES;
  const maxOutputSpoolBytes = Math.min(
    MAX_RUN_OUTPUT_SPOOL_BYTES,
    Math.max(1, options.maxOutputSpoolBytes || MAX_RUN_OUTPUT_SPOOL_BYTES),
  );
  if (options.artifactDir) {
    await fs.mkdir(options.artifactDir, { recursive: true });
  }
  const spoolBudget = new OutputSpoolBudget(maxOutputSpoolBytes);
  let child: ReturnType<typeof spawn> | null = null;
  let outputWriteError: Error | null = null;
  const handleOutputWriteError = (error: Error) => {
    if (outputWriteError) {
      return;
    }
    outputWriteError = error;
    spoolBudget.stop();
    if (child && child.exitCode === null && child.signalCode === null) {
      killProcess(child);
    }
  };
  const stdoutCollector = new OutputCollector({
    commandKey: options.definition.commandKey,
    streamName: 'stdout',
    artifactDir: options.artifactDir,
    maxInlineLogBytes,
    spoolBudget,
    onWriteError: handleOutputWriteError,
  });
  const stderrCollector = new OutputCollector({
    commandKey: options.definition.commandKey,
    streamName: 'stderr',
    artifactDir: options.artifactDir,
    maxInlineLogBytes,
    spoolBudget,
    onWriteError: handleOutputWriteError,
  });
  let terminalStatus: ExecTerminalStatus | null = null;
  let timeoutTimer: ReturnType<typeof setTimeout> | null = null;

  const spawnedChild = spawn(prepared.executable, prepared.args, {
    cwd: prepared.cwd,
    env: prepared.env,
    detached: process.platform !== 'win32',
    shell: false,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child = spawnedChild;

  const closeResultPromise = new Promise<{ exitCode: number | null; signal: NodeJS.Signals | null }>(
    (resolve, reject) => {
      timeoutTimer = setTimeout(() => {
        terminalStatus = terminalStatus || 'timeout';
        killProcess(spawnedChild);
      }, prepared.timeoutMs);

      spawnedChild.stdout.on('data', (chunk) => {
        stdoutCollector.write(
          chunk,
          () => spawnedChild.stdout.pause(),
          () => spawnedChild.stdout.resume(),
        );
      });
      spawnedChild.stderr.on('data', (chunk) => {
        stderrCollector.write(
          chunk,
          () => spawnedChild.stderr.pause(),
          () => spawnedChild.stderr.resume(),
        );
      });
      spawnedChild.on('error', reject);
      spawnedChild.on('close', (exitCode, signal) => {
        resolve({
          exitCode,
          signal,
        });
      });
    },
  );
  const cancelHandler = () => {
    terminalStatus = terminalStatus || 'canceled';
    killProcess(spawnedChild);
  };
  const leaseLostHandler = () => {
    terminalStatus = terminalStatus || 'lease_lost';
    killProcess(spawnedChild);
  };
  options.cancelSignal?.addEventListener('abort', cancelHandler, { once: true });
  options.leaseLostSignal?.addEventListener('abort', leaseLostHandler, { once: true });
  if (options.cancelSignal?.aborted) {
    cancelHandler();
  }
  if (options.leaseLostSignal?.aborted) {
    leaseLostHandler();
  }

  let closeResult: { exitCode: number | null; signal: NodeJS.Signals | null };
  try {
    closeResult = await closeResultPromise;
  } catch (error) {
    await stdoutCollector.cleanup();
    await stderrCollector.cleanup();
    throw error;
  } finally {
    if (timeoutTimer) {
      clearTimeout(timeoutTimer);
    }
    options.cancelSignal?.removeEventListener('abort', cancelHandler);
    options.leaseLostSignal?.removeEventListener('abort', leaseLostHandler);
  }

  const status: ExecTerminalStatus = terminalStatus || (closeResult.exitCode === 0 ? 'succeeded' : 'failed');
  let stdout: ExecOutputRecord;
  let stderr: ExecOutputRecord;
  try {
    stdout = await stdoutCollector.finish();
    stderr = await stderrCollector.finish();
  } catch (error) {
    await stdoutCollector.cleanup();
    await stderrCollector.cleanup();
    throw error;
  }

  return {
    status,
    exitCode: closeResult.exitCode,
    signal: closeResult.signal,
    stdout,
    stderr,
  };
}

export async function executeAllowlistedCommand(options: ExecuteAllowlistedCommandOptions): Promise<ExecDriverResult> {
  const definition = getAllowlistedDefinition(options.allowlist, options.commandKey);
  return await executeCommand({
    ...options,
    definition,
  });
}
