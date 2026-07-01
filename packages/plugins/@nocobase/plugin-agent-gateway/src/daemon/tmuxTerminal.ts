/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { execFile, spawn } from 'child_process';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';

import { redactObservabilityText } from '../server/security/redaction';
import { ExecCommandDefinition, ExecDriverResult, ExecTerminalStatus } from './execDriver';

export interface TmuxCommandOptions {
  runId: string;
  definition: ExecCommandDefinition;
  args?: string[];
  cwd: string;
  workspaceRoot: string;
  env?: Record<string, string>;
  timeoutMs: number;
  artifactDir?: string;
  cancelSignal?: AbortSignal;
  leaseLostSignal?: AbortSignal;
  onSessionStarted?(metadata: TmuxSessionMetadata): Promise<void> | void;
  onSessionEnded?(metadata: TmuxSessionEndMetadata): Promise<void> | void;
}

export interface TmuxSessionMetadata {
  backend: 'tmux';
  sessionName: string;
  startedAt: string;
}

export interface TmuxSessionEndMetadata extends TmuxSessionMetadata {
  endedAt: string;
  exitCode: number | null;
  terminalStatus: ExecTerminalStatus;
}

export interface TmuxSnapshot {
  available: boolean;
  output: string;
  sessionName: string;
  capturedAt: string;
}

const TERMINAL_CAPTURE_LIMIT = 64 * 1024;
const DEFAULT_CAPTURE_LINES = 2000;
const TMUX_SESSION_PATTERN = /^ag-run-[a-z0-9-]{8,80}$/i;
const SHELL_ENV_KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

function execTmux(args: string[], options: { timeoutMs?: number } = {}) {
  return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    execFile('tmux', args, { timeout: options.timeoutMs || 10_000 }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve({
        stdout,
        stderr,
      });
    });
  });
}

function shellQuote(value: string) {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function getExitCode(rawValue: string) {
  const parsed = Number(rawValue.trim());
  return Number.isInteger(parsed) ? parsed : null;
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

export function getManagedTmuxSessionName(runId: string) {
  const normalized = runId
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .slice(0, 64);
  return `ag-run-${normalized || Date.now()}`;
}

function getDoneSignalName(sessionName: string) {
  return `${sessionName}-done`;
}

function assertManagedSessionName(sessionName: string) {
  if (!isManagedTmuxSessionName(sessionName)) {
    throw new Error('Invalid managed tmux session name');
  }
}

export function isManagedTmuxSessionName(sessionName: string) {
  return TMUX_SESSION_PATTERN.test(sessionName);
}

function buildShellCommand(options: {
  definition: ExecCommandDefinition;
  args?: string[];
  env?: Record<string, string>;
  exitCodePath: string;
  doneSignalName: string;
}) {
  const commandParts = [
    shellQuote(options.definition.executable),
    ...(options.definition.baseArgs || []).map(shellQuote),
    ...(options.args || []).map(shellQuote),
  ];
  const envLines = Object.entries(options.env || {})
    .filter(([key]) => SHELL_ENV_KEY_PATTERN.test(key))
    .map(([key, value]) => `export ${key}=${shellQuote(value)};`);
  return [
    'tmux set-option -w remain-on-exit on >/dev/null 2>&1 || true;',
    'set +e;',
    ...envLines,
    `${commandParts.join(' ')};`,
    'code=$?;',
    `printf '%s' "$code" > ${shellQuote(options.exitCodePath)};`,
    `printf '\\n[agent-gateway] process exited with code %s\\n' "$code";`,
    `tmux wait-for -S ${shellQuote(options.doneSignalName)};`,
  ].join(' ');
}

async function sessionExists(sessionName: string) {
  try {
    await execTmux(['has-session', '-t', sessionName], { timeoutMs: 2000 });
    return true;
  } catch {
    return false;
  }
}

async function waitForSignal(signalName: string, timeoutMs: number) {
  return await new Promise<'completed' | 'timeout'>((resolve, reject) => {
    let closed = false;
    const child = spawn('tmux', ['wait-for', signalName], {
      stdio: 'ignore',
    });
    const timer = setTimeout(() => {
      closed = true;
      child.kill('SIGTERM');
      resolve('timeout');
    }, timeoutMs);

    child.on('error', (error) => {
      if (!closed) {
        closed = true;
        clearTimeout(timer);
        reject(error);
      }
    });
    child.on('close', (exitCode) => {
      if (closed) {
        return;
      }
      closed = true;
      clearTimeout(timer);
      if (exitCode === 0) {
        resolve('completed');
      } else {
        reject(new Error(`tmux wait-for exited with code ${exitCode}`));
      }
    });
  });
}

async function killTmuxSessionIfExists(sessionName: string) {
  if (await sessionExists(sessionName)) {
    await execTmux(['kill-session', '-t', sessionName]);
  }
}

async function writeTextArtifact(artifactDir: string | undefined, fileName: string, content: string) {
  if (!artifactDir) {
    return undefined;
  }
  await fs.mkdir(artifactDir, { recursive: true });
  const artifactPath = path.join(artifactDir, fileName);
  await fs.writeFile(artifactPath, content);
  return artifactPath;
}

export async function captureTmuxSession(sessionName: string, lines = DEFAULT_CAPTURE_LINES): Promise<TmuxSnapshot> {
  assertManagedSessionName(sessionName);
  const capturedAt = new Date().toISOString();
  if (!(await sessionExists(sessionName))) {
    return {
      available: false,
      output: '',
      sessionName,
      capturedAt,
    };
  }

  const { stdout } = await execTmux(['capture-pane', '-t', sessionName, '-p', '-S', `-${lines}`]);
  const redactedOutput = redactObservabilityText(stdout);
  return {
    available: true,
    output:
      Buffer.byteLength(redactedOutput) > TERMINAL_CAPTURE_LIMIT
        ? redactedOutput.slice(-TERMINAL_CAPTURE_LIMIT)
        : redactedOutput,
    sessionName,
    capturedAt,
  };
}

export async function sendTmuxInput(sessionName: string, input: string, appendEnter = false) {
  assertManagedSessionName(sessionName);
  if (!(await sessionExists(sessionName))) {
    throw new Error('tmux session is not available');
  }
  if (input) {
    await execTmux(['send-keys', '-t', sessionName, '-l', '--', input]);
  }
  if (appendEnter) {
    await execTmux(['send-keys', '-t', sessionName, 'Enter']);
  }
}

export async function interruptTmuxSession(sessionName: string) {
  assertManagedSessionName(sessionName);
  if (!(await sessionExists(sessionName))) {
    throw new Error('tmux session is not available');
  }
  await execTmux(['send-keys', '-t', sessionName, 'C-c']);
}

export async function terminateTmuxSession(sessionName: string) {
  assertManagedSessionName(sessionName);
  await killTmuxSessionIfExists(sessionName);
  await execTmux(['wait-for', '-S', getDoneSignalName(sessionName)]).catch(() => {
    // A best-effort wake-up for daemon waiters.
  });
}

export async function executeTmuxCommand(options: TmuxCommandOptions): Promise<ExecDriverResult> {
  const sessionName = getManagedTmuxSessionName(options.runId);
  const startedAt = new Date().toISOString();
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), `${sessionName}-`));
  const exitCodePath = path.join(tempDir, 'exit-code');
  const doneSignalName = getDoneSignalName(sessionName);
  const guardedCwd = await resolveGuardedCwd(options.workspaceRoot, options.cwd);
  let terminalStatus: ExecTerminalStatus | null = null;
  let forceKillTimer: ReturnType<typeof setTimeout> | null = null;

  await killTmuxSessionIfExists(sessionName);
  const shellCommand = buildShellCommand({
    definition: options.definition,
    args: options.args,
    env: options.env,
    exitCodePath,
    doneSignalName,
  });
  await execTmux(['new-session', '-d', '-s', sessionName, '-c', guardedCwd, '--', 'sh', '-lc', shellCommand]);
  await execTmux(['set-option', '-t', sessionName, 'remain-on-exit', 'on']).catch(() => {
    // Older tmux versions may reject this after a very short-lived process exits.
  });
  await options.onSessionStarted?.({
    backend: 'tmux',
    sessionName,
    startedAt,
  });

  const cancelHandler = () => {
    terminalStatus = terminalStatus || 'canceled';
    interruptTmuxSession(sessionName).catch(() => {
      // The session may have already ended.
    });
    forceKillTimer = setTimeout(() => {
      terminateTmuxSession(sessionName).catch(() => {
        // The session may have already ended.
      });
    }, 2000);
  };
  const leaseLostHandler = () => {
    terminalStatus = terminalStatus || 'lease_lost';
    terminateTmuxSession(sessionName).catch(() => {
      // The session may have already ended.
    });
  };
  options.cancelSignal?.addEventListener('abort', cancelHandler, { once: true });
  options.leaseLostSignal?.addEventListener('abort', leaseLostHandler, { once: true });
  if (options.cancelSignal?.aborted) {
    cancelHandler();
  }
  if (options.leaseLostSignal?.aborted) {
    leaseLostHandler();
  }

  let completed = false;
  try {
    completed = (await waitForSignal(doneSignalName, options.timeoutMs)) === 'completed';
    if (!completed) {
      terminalStatus = terminalStatus || 'timeout';
      await terminateTmuxSession(sessionName);
    }
  } finally {
    if (forceKillTimer) {
      clearTimeout(forceKillTimer);
    }
    options.cancelSignal?.removeEventListener('abort', cancelHandler);
    options.leaseLostSignal?.removeEventListener('abort', leaseLostHandler);
  }

  const rawExitCode = await fs.readFile(exitCodePath, 'utf8').catch(() => '');
  const exitCode = completed ? getExitCode(rawExitCode) : null;
  const status: ExecTerminalStatus = terminalStatus || (exitCode === 0 ? 'succeeded' : 'failed');
  const snapshot = await captureTmuxSession(sessionName).catch(() => ({
    available: false,
    output: '',
    sessionName,
    capturedAt: new Date().toISOString(),
  }));
  const artifactPath = await writeTextArtifact(options.artifactDir, `${sessionName}-terminal.log`, snapshot.output);
  const endedAt = new Date().toISOString();
  await options.onSessionEnded?.({
    backend: 'tmux',
    sessionName,
    startedAt,
    endedAt,
    exitCode,
    terminalStatus: status,
  });

  return {
    status,
    exitCode,
    signal: null,
    stdout: {
      text: artifactPath ? null : snapshot.output,
      sizeBytes: Buffer.byteLength(snapshot.output),
      artifactPath,
    },
    stderr: {
      text: null,
      sizeBytes: 0,
    },
  };
}
