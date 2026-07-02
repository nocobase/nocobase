/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { execFile, spawn } from 'child_process';
import { createReadStream, createWriteStream } from 'fs';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { StringDecoder } from 'string_decoder';

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
  liveOutputPollIntervalMs?: number;
  onOutputChunk?(chunk: string): Promise<void> | void;
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
const TMUX_SESSION_PATTERN = /^ag-run-[a-z0-9-]{1,80}$/i;
const SHELL_ENV_KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;
const REDACTION_STREAM_HIGH_WATER_MARK = 16 * 1024;
const MAX_REDACTION_PENDING_LINE_CHARS = 64 * 1024;
const REDACTED_OVERSIZED_TERMINAL_LINE = '[REDACTED_OVERSIZED_TERMINAL_LINE]\n';
const DEFAULT_LIVE_OUTPUT_POLL_INTERVAL_MS = 100;
const PARTIAL_LINE_SENSITIVE_PATTERN =
  /\b(?:Authorization|Cookie|Set-Cookie)\b|\bBearer\b|\b(?:token|secret|password|api[_-]?key|private[_-]?key|access[_-]?key|command|commandPath|cwd|env)(?:\.[A-Za-z0-9_-]+)?\b/i;
const PARTIAL_LINE_SENSITIVE_PREFIXES = [
  'authorization',
  'cookie',
  'set-cookie',
  'bearer',
  'token',
  'secret',
  'password',
  'api_key',
  'api-key',
  'apikey',
  'private_key',
  'private-key',
  'privatekey',
  'access_key',
  'access-key',
  'accesskey',
  'commandpath',
  'command',
  'cwd',
  'env',
];

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

function shouldDeferPartialLiveLine(lineText: string) {
  return PARTIAL_LINE_SENSITIVE_PATTERN.test(lineText);
}

function getSensitivePrefixSuffixLength(lineText: string) {
  const normalized = lineText.toLowerCase();
  const maxPrefixLength = Math.max(...PARTIAL_LINE_SENSITIVE_PREFIXES.map((prefix) => prefix.length));
  const maxSuffixLength = Math.min(maxPrefixLength - 1, normalized.length);
  for (let length = maxSuffixLength; length > 0; length -= 1) {
    const suffix = normalized.slice(-length);
    if (PARTIAL_LINE_SENSITIVE_PREFIXES.some((prefix) => prefix.startsWith(suffix))) {
      return length;
    }
  }
  return 0;
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
    "trap 'stty echo 2>/dev/null || true' EXIT;",
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

async function startPaneCapture(sessionName: string, paneCapturePath: string) {
  await execTmux(['pipe-pane', '-o', '-t', sessionName, `cat >> ${shellQuote(paneCapturePath)}`]);
}

async function stopPaneCapture(sessionName: string) {
  await execTmux(['pipe-pane', '-t', sessionName]).catch(() => {
    // The session may already have ended or been terminated.
  });
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

async function writeArtifactChunk(writer: ReturnType<typeof createWriteStream>, content: string) {
  if (!content) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    writer.write(content, (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

async function closeArtifactWriter(writer: ReturnType<typeof createWriteStream>) {
  await new Promise<void>((resolve, reject) => {
    writer.once('finish', resolve);
    writer.once('error', reject);
    writer.end();
  });
}

function createRedactedLiveOutputTailer(options: {
  sourcePath: string;
  pollIntervalMs?: number;
  onChunk(chunk: string): Promise<void> | void;
}) {
  const decoder = new StringDecoder('utf8');
  let pendingLineText = '';
  let droppingOversizedLine = false;
  let readOffset = 0;
  let readPromise: Promise<void> | null = null;
  let stopped = false;

  const emitChunk = async (chunk: string) => {
    if (chunk) {
      await options.onChunk(chunk);
    }
  };

  const emitCompleteLine = async (lineText: string) => {
    if (lineText.length > MAX_REDACTION_PENDING_LINE_CHARS) {
      await emitChunk(REDACTED_OVERSIZED_TERMINAL_LINE);
      return;
    }
    await emitChunk(redactObservabilityText(lineText));
  };

  const consumeDecodedText = async (decodedText: string) => {
    let text = decodedText;
    while (text.length > 0) {
      if (droppingOversizedLine) {
        const newlineIndex = text.indexOf('\n');
        if (newlineIndex === -1) {
          return;
        }
        droppingOversizedLine = false;
        text = text.slice(newlineIndex + 1);
        continue;
      }

      const newlineIndex = text.indexOf('\n');
      if (newlineIndex === -1) {
        pendingLineText += text;
        if (pendingLineText.length > MAX_REDACTION_PENDING_LINE_CHARS) {
          await emitChunk(REDACTED_OVERSIZED_TERMINAL_LINE);
          pendingLineText = '';
          droppingOversizedLine = true;
        }
        return;
      }

      await emitCompleteLine(pendingLineText + text.slice(0, newlineIndex + 1));
      pendingLineText = '';
      text = text.slice(newlineIndex + 1);
    }
  };

  const flushPartialLine = async (force = false) => {
    if (!pendingLineText || droppingOversizedLine) {
      return;
    }
    if (force) {
      await emitChunk(redactObservabilityText(pendingLineText));
      pendingLineText = '';
      return;
    }
    if (shouldDeferPartialLiveLine(pendingLineText)) {
      return;
    }
    const retainedSuffixLength = getSensitivePrefixSuffixLength(pendingLineText);
    const flushLength = pendingLineText.length - retainedSuffixLength;
    if (flushLength <= 0) {
      return;
    }
    await emitChunk(redactObservabilityText(pendingLineText.slice(0, flushLength)));
    pendingLineText = pendingLineText.slice(flushLength);
  };

  const readAvailable = async () => {
    const stat = await fs.stat(options.sourcePath).catch(() => null);
    if (!stat || stat.size <= readOffset) {
      return;
    }

    const file = await fs.open(options.sourcePath, 'r');
    try {
      while (readOffset < stat.size) {
        const length = Math.min(REDACTION_STREAM_HIGH_WATER_MARK, stat.size - readOffset);
        const buffer = Buffer.alloc(length);
        const { bytesRead } = await file.read(buffer, 0, length, readOffset);
        if (!bytesRead) {
          return;
        }
        readOffset += bytesRead;
        await consumeDecodedText(decoder.write(buffer.subarray(0, bytesRead)));
      }
      if (!stopped) {
        await flushPartialLine(false);
      }
    } finally {
      await file.close();
    }
  };

  const readSafely = async () => {
    try {
      await readAvailable();
    } catch {
      // Live streaming is observational; final artifact capture remains authoritative.
    }
  };

  const timer = setInterval(() => {
    if (readPromise) {
      return;
    }
    readPromise = readSafely().finally(() => {
      readPromise = null;
    });
  }, options.pollIntervalMs || DEFAULT_LIVE_OUTPUT_POLL_INTERVAL_MS);

  return async () => {
    if (stopped) {
      return;
    }
    stopped = true;
    clearInterval(timer);
    await readPromise;
    await readSafely();
    await consumeDecodedText(decoder.end());
    await flushPartialLine(true);
  };
}

export async function writeRedactedArtifactFromFile(options: {
  sourcePath: string;
  artifactDir: string;
  fileName: string;
}) {
  await fs.mkdir(options.artifactDir, { recursive: true });
  const artifactPath = path.join(options.artifactDir, options.fileName);
  const decoder = new StringDecoder('utf8');
  const reader = createReadStream(options.sourcePath, {
    highWaterMark: REDACTION_STREAM_HIGH_WATER_MARK,
  });
  const writer = createWriteStream(artifactPath, {
    flags: 'w',
  });
  let pendingLineText = '';
  let droppingOversizedLine = false;

  const writeCompleteLine = async (lineText: string) => {
    if (lineText.length > MAX_REDACTION_PENDING_LINE_CHARS) {
      await writeArtifactChunk(writer, REDACTED_OVERSIZED_TERMINAL_LINE);
      return;
    }
    await writeArtifactChunk(writer, redactObservabilityText(lineText));
  };

  const writeDecodedText = async (decodedText: string) => {
    let text = decodedText;
    while (text.length > 0) {
      if (droppingOversizedLine) {
        const newlineIndex = text.indexOf('\n');
        if (newlineIndex === -1) {
          return;
        }
        droppingOversizedLine = false;
        text = text.slice(newlineIndex + 1);
        continue;
      }

      const newlineIndex = text.indexOf('\n');
      if (newlineIndex === -1) {
        pendingLineText += text;
        if (pendingLineText.length > MAX_REDACTION_PENDING_LINE_CHARS) {
          await writeArtifactChunk(writer, REDACTED_OVERSIZED_TERMINAL_LINE);
          pendingLineText = '';
          droppingOversizedLine = true;
        }
        return;
      }

      await writeCompleteLine(pendingLineText + text.slice(0, newlineIndex + 1));
      pendingLineText = '';
      text = text.slice(newlineIndex + 1);
    }
  };

  try {
    for await (const chunk of reader) {
      const chunkBuffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
      await writeDecodedText(decoder.write(chunkBuffer));
    }

    await writeDecodedText(decoder.end());
    if (!droppingOversizedLine) {
      await writeArtifactChunk(writer, redactObservabilityText(pendingLineText));
    }
  } finally {
    await closeArtifactWriter(writer);
  }
  return artifactPath;
}

async function buildTmuxStdoutOutput(options: {
  artifactDir?: string;
  sessionName: string;
  paneCapturePath: string;
  fallbackOutput: string;
}): Promise<ExecDriverResult['stdout']> {
  const rawPaneStat = await fs.stat(options.paneCapturePath).catch(() => null);
  if (rawPaneStat?.size) {
    if (options.artifactDir) {
      const artifactPath = await writeRedactedArtifactFromFile({
        sourcePath: options.paneCapturePath,
        artifactDir: options.artifactDir,
        fileName: `${options.sessionName}-terminal.log`,
      });
      const artifactStat = await fs.stat(artifactPath);
      return {
        text: null,
        sizeBytes: artifactStat.size,
        artifactPath,
      };
    }
    const file = await fs.open(options.paneCapturePath, 'r');
    try {
      const buffer = Buffer.alloc(Math.min(rawPaneStat.size, TERMINAL_CAPTURE_LIMIT));
      const { bytesRead } = await file.read(buffer, 0, buffer.length, 0);
      return {
        text: redactObservabilityText(buffer.subarray(0, bytesRead).toString('utf8')),
        sizeBytes: bytesRead,
      };
    } finally {
      await file.close();
    }
  }

  const stdoutText = redactObservabilityText(options.fallbackOutput);
  const artifactPath = await writeTextArtifact(options.artifactDir, `${options.sessionName}-terminal.log`, stdoutText);
  return {
    text: artifactPath ? null : stdoutText,
    sizeBytes: Buffer.byteLength(stdoutText),
    artifactPath,
  };
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
  const paneCapturePath = path.join(tempDir, 'pane-output.raw.log');
  const commandScriptPath = path.join(tempDir, 'command.sh');
  const doneSignalName = getDoneSignalName(sessionName);
  const guardedCwd = await resolveGuardedCwd(options.workspaceRoot, options.cwd);
  let terminalStatus: ExecTerminalStatus | null = null;
  let forceKillTimer: ReturnType<typeof setTimeout> | null = null;
  let stopLiveOutputTailer: (() => Promise<void>) | null = null;

  try {
    await killTmuxSessionIfExists(sessionName);
    const shellCommand = buildShellCommand({
      definition: options.definition,
      args: options.args,
      env: options.env,
      exitCodePath,
      doneSignalName,
    });
    await fs.writeFile(commandScriptPath, `${shellCommand}\n`, { mode: 0o700 });
    await execTmux([
      'new-session',
      '-d',
      '-s',
      sessionName,
      '-c',
      guardedCwd,
      '--',
      'sh',
      '-lc',
      'stty -echo 2>/dev/null || true; exec sh',
    ]);
    await execTmux(['set-option', '-t', sessionName, 'remain-on-exit', 'on']).catch(() => {
      // Older tmux versions may reject this after a very short-lived process exits.
    });
    await startPaneCapture(sessionName, paneCapturePath);
    if (options.onOutputChunk) {
      stopLiveOutputTailer = createRedactedLiveOutputTailer({
        sourcePath: paneCapturePath,
        pollIntervalMs: options.liveOutputPollIntervalMs,
        onChunk: options.onOutputChunk,
      });
    }
    await options.onSessionStarted?.({
      backend: 'tmux',
      sessionName,
      startedAt,
    });
    await sendTmuxInput(sessionName, `exec sh ${shellQuote(commandScriptPath)}`, true);

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
    await stopPaneCapture(sessionName);
    if (stopLiveOutputTailer) {
      await stopLiveOutputTailer();
      stopLiveOutputTailer = null;
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
    const stdout = await buildTmuxStdoutOutput({
      artifactDir: options.artifactDir,
      sessionName,
      paneCapturePath,
      fallbackOutput: snapshot.output,
    });
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
      stdout,
      stderr: {
        text: null,
        sizeBytes: 0,
      },
    };
  } finally {
    await stopPaneCapture(sessionName);
    if (stopLiveOutputTailer) {
      await stopLiveOutputTailer();
    }
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {
      // The temp directory only contains raw pane capture and exit-code helpers.
    });
    if (forceKillTimer) {
      clearTimeout(forceKillTimer);
    }
  }
}
