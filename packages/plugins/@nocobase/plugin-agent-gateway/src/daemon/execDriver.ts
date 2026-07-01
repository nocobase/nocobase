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

import { redactObservabilityText } from '../server/security/redaction';

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
}

export interface ExecuteAllowlistedCommandOptions extends Omit<ExecuteCommandOptions, 'definition'> {
  commandKey: string;
  allowlist: ExecCommandAllowlist;
}

export interface ExecOutputRecord {
  text: string | null;
  sizeBytes: number;
  artifactPath?: string;
}

export interface ExecDriverResult {
  status: ExecTerminalStatus;
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  stdout: ExecOutputRecord;
  stderr: ExecOutputRecord;
}

const DEFAULT_TIMEOUT_MS = 30 * 60 * 1000;
const DEFAULT_MAX_INLINE_LOG_BYTES = 64 * 1024;
const INHERITED_ENV_KEYS = ['PATH', 'HOME', 'TMPDIR', 'TEMP', 'TMP', 'SystemRoot', 'WINDIR'];

class OutputCollector {
  private inlineChunks: string[] = [];
  private artifactPath?: string;
  private writeStream?: WriteStream;
  private writeError: Error | null = null;
  private sizeBytes = 0;
  private droppedInline = false;

  constructor(
    private readonly options: {
      commandKey: string;
      streamName: 'stdout' | 'stderr';
      artifactDir?: string;
      maxInlineLogBytes: number;
    },
  ) {}

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
    this.writeStream.on('error', (error) => {
      this.writeError = error;
    });
    if (this.inlineChunks.length) {
      this.writeStream.write(this.inlineChunks.join(''));
      this.inlineChunks = [];
    }
    return this.writeStream;
  }

  write(rawChunk: unknown, pause?: () => void, resume?: () => void) {
    const text = redactObservabilityText(String(rawChunk));
    const nextSizeBytes = this.sizeBytes + Buffer.byteLength(text);
    const shouldInline = !this.writeStream && nextSizeBytes <= this.options.maxInlineLogBytes;

    if (shouldInline) {
      this.inlineChunks.push(text);
      this.sizeBytes = nextSizeBytes;
      return;
    }

    const stream = this.ensureArtifactStream();
    this.sizeBytes = nextSizeBytes;
    if (!stream) {
      this.inlineChunks = [];
      this.droppedInline = true;
      return;
    }

    const canContinue = stream.write(text);
    if (!canContinue && pause && resume) {
      pause();
      stream.once('drain', resume);
    }
  }

  async finish(): Promise<ExecOutputRecord> {
    if (this.writeStream) {
      await new Promise<void>((resolve, reject) => {
        this.writeStream?.once('finish', resolve);
        this.writeStream?.once('error', reject);
        this.writeStream?.end();
      });
    }
    if (this.writeError) {
      throw this.writeError;
    }
    if (this.artifactPath) {
      return {
        text: null,
        sizeBytes: this.sizeBytes,
        artifactPath: this.artifactPath,
      };
    }
    if (this.droppedInline) {
      return {
        text: null,
        sizeBytes: this.sizeBytes,
      };
    }
    return {
      text: this.inlineChunks.join(''),
      sizeBytes: this.sizeBytes,
    };
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

function buildEnv(definition: ExecCommandDefinition, providedEnv: Record<string, string> = {}) {
  const allowedProvidedKeys = new Set(definition.allowedEnvKeys || []);
  const env: NodeJS.ProcessEnv = {};
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
  return env;
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
  const cwd = await resolveGuardedCwd(options.workspaceRoot, options.cwd);
  const env = buildEnv(options.definition, options.env);
  const timeoutMs = options.timeoutMs || options.definition.defaultTimeoutMs || DEFAULT_TIMEOUT_MS;
  const maxInlineLogBytes = options.maxInlineLogBytes || DEFAULT_MAX_INLINE_LOG_BYTES;
  if (options.artifactDir) {
    await fs.mkdir(options.artifactDir, { recursive: true });
  }
  const stdoutCollector = new OutputCollector({
    commandKey: options.definition.commandKey,
    streamName: 'stdout',
    artifactDir: options.artifactDir,
    maxInlineLogBytes,
  });
  const stderrCollector = new OutputCollector({
    commandKey: options.definition.commandKey,
    streamName: 'stderr',
    artifactDir: options.artifactDir,
    maxInlineLogBytes,
  });
  let terminalStatus: ExecTerminalStatus | null = null;
  let timeoutTimer: ReturnType<typeof setTimeout> | null = null;

  const child = spawn(
    options.definition.executable,
    [...(options.definition.baseArgs || []), ...(options.args || [])],
    {
      cwd,
      env,
      detached: process.platform !== 'win32',
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );

  const closeResultPromise = new Promise<{ exitCode: number | null; signal: NodeJS.Signals | null }>(
    (resolve, reject) => {
      timeoutTimer = setTimeout(() => {
        terminalStatus = terminalStatus || 'timeout';
        killProcess(child);
      }, timeoutMs);

      child.stdout.on('data', (chunk) => {
        stdoutCollector.write(
          chunk,
          () => child.stdout.pause(),
          () => child.stdout.resume(),
        );
      });
      child.stderr.on('data', (chunk) => {
        stderrCollector.write(
          chunk,
          () => child.stderr.pause(),
          () => child.stderr.resume(),
        );
      });
      child.on('error', reject);
      child.on('close', (exitCode, signal) => {
        resolve({
          exitCode,
          signal,
        });
      });
    },
  );
  const cancelHandler = () => {
    terminalStatus = terminalStatus || 'canceled';
    killProcess(child);
  };
  const leaseLostHandler = () => {
    terminalStatus = terminalStatus || 'lease_lost';
    killProcess(child);
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
  } finally {
    if (timeoutTimer) {
      clearTimeout(timeoutTimer);
    }
    options.cancelSignal?.removeEventListener('abort', cancelHandler);
    options.leaseLostSignal?.removeEventListener('abort', leaseLostHandler);
  }

  const status: ExecTerminalStatus = terminalStatus || (closeResult.exitCode === 0 ? 'succeeded' : 'failed');
  const stdout = await stdoutCollector.finish();
  const stderr = await stderrCollector.finish();

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
