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
import { pipeline } from 'stream/promises';

import { AGENT_GATEWAY_TERMINATE_CONTROL_CANCEL_REASON } from '../shared/runControl';
import { isManagedTmuxSessionName } from '../shared/terminalSession';
import {
  ExecCommandDefinition,
  ExecDriverResult,
  ExecTerminalStatus,
  MAX_RUN_OUTPUT_SPOOL_BYTES,
  prepareCommandExecution,
} from './execDriver';

export { isManagedTmuxSessionName } from '../shared/terminalSession';

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
  maxOutputSpoolBytes?: number;
  outputMode?: 'terminal' | 'structured';
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

export const TMUX_TERMINATE_CANCEL_REASON = AGENT_GATEWAY_TERMINATE_CONTROL_CANCEL_REASON;

const TERMINAL_CAPTURE_LIMIT = 64 * 1024;
const DEFAULT_CAPTURE_LINES = 2000;
const SHELL_ENV_KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;
const TERMINAL_STREAM_HIGH_WATER_MARK = 16 * 1024;
const DEFAULT_LIVE_OUTPUT_POLL_INTERVAL_MS = 100;

function isTerminateCancelReason(reason: unknown) {
  return reason === TMUX_TERMINATE_CANCEL_REASON;
}
const PANE_CAPTURE_FLUSH_MAX_WAIT_MS = 500;
const PANE_CAPTURE_FLUSH_POLL_MS = 25;
const PANE_CAPTURE_FLUSH_STABLE_POLLS = 2;
const PANE_ENDED_SIGNAL_GRACE_MS = 1000;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

function buildShellCommand(options: {
  executable: string;
  args: string[];
  env: Record<string, string>;
  exitCodePath: string;
  outputFifoPath?: string;
  doneSignalName: string;
}) {
  const commandParts = [shellQuote(options.executable), ...options.args.map(shellQuote)];
  const envLines = Object.entries(options.env)
    .filter(([key]) => SHELL_ENV_KEY_PATTERN.test(key))
    .map(([key, value]) => `export ${key}=${shellQuote(value)};`);
  const outputFifoPath = options.outputFifoPath;
  const relaySetup = outputFifoPath
    ? [
        'relay_pid=;',
        `output_fifo=${shellQuote(outputFifoPath)};`,
        'cleanup_relay() {',
        '  if [ -n "$relay_pid" ]; then',
        '    kill "$relay_pid" >/dev/null 2>&1 || true;',
        '    wait "$relay_pid" 2>/dev/null || true;',
        '  fi;',
        '  rm -f "$output_fifo";',
        '};',
        'rm -f "$output_fifo";',
        'mkfifo "$output_fifo";',
        'cat "$output_fifo" &',
        'relay_pid=$!;',
      ]
    : [];
  const commandLine = outputFifoPath
    ? `${commandParts.join(' ')} < /dev/null > "$output_fifo" 2>&1;`
    : `${commandParts.join(' ')};`;
  const relayTeardown = outputFifoPath
    ? ['wait "$relay_pid" 2>/dev/null || true;', 'relay_pid=;', 'cleanup_relay;']
    : [];
  return [
    outputFifoPath
      ? "trap 'cleanup_relay; stty echo 2>/dev/null || true' EXIT INT TERM;"
      : "trap 'stty echo 2>/dev/null || true' EXIT;",
    'tmux set-option -w remain-on-exit on >/dev/null 2>&1 || true;',
    'set +e;',
    ...envLines,
    ...relaySetup,
    commandLine,
    'code=$?;',
    ...relayTeardown,
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

async function isSessionPaneDead(sessionName: string) {
  try {
    const { stdout } = await execTmux(['list-panes', '-t', sessionName, '-F', '#{pane_dead}'], { timeoutMs: 2000 });
    const paneStates = stdout
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    return paneStates.length > 0 && paneStates.every((state) => state === '1');
  } catch {
    return true;
  }
}

type TmuxWaitResult = 'signal' | 'pane-ended' | 'timeout';

async function waitForSignalOrPaneEnd(sessionName: string, signalName: string, timeoutMs: number) {
  return await new Promise<TmuxWaitResult>((resolve, reject) => {
    let closed = false;
    let checkingPane = false;
    let paneEndedAt: number | null = null;
    const child = spawn('tmux', ['wait-for', signalName], {
      stdio: 'ignore',
    });
    const finish = (result: TmuxWaitResult) => {
      if (closed) {
        return;
      }
      closed = true;
      child.kill('SIGTERM');
      clearTimeout(timer);
      clearInterval(paneTimer);
      resolve(result);
    };
    const timer = setTimeout(() => {
      finish('timeout');
    }, timeoutMs);
    const paneTimer = setInterval(() => {
      if (closed || checkingPane) {
        return;
      }
      checkingPane = true;
      return isSessionPaneDead(sessionName)
        .then((paneDead) => {
          if (!paneDead) {
            paneEndedAt = null;
            return;
          }
          const now = Date.now();
          if (paneEndedAt === null) {
            paneEndedAt = now;
            return;
          }
          if (now - paneEndedAt >= PANE_ENDED_SIGNAL_GRACE_MS) {
            finish('pane-ended');
          }
        })
        .catch(() => {
          finish('pane-ended');
        })
        .finally(() => {
          checkingPane = false;
        });
    }, 250);

    child.on('error', (error) => {
      if (!closed) {
        closed = true;
        clearTimeout(timer);
        clearInterval(paneTimer);
        reject(error);
      }
    });
    child.on('close', (exitCode) => {
      if (closed) {
        return;
      }
      closed = true;
      clearTimeout(timer);
      clearInterval(paneTimer);
      if (exitCode === 0) {
        resolve('signal');
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

function getOutputSpoolLimit(requestedBytes?: number) {
  return Math.min(MAX_RUN_OUTPUT_SPOOL_BYTES, Math.max(1, requestedBytes || MAX_RUN_OUTPUT_SPOOL_BYTES));
}

async function startPaneCapture(sessionName: string, paneCapturePath: string, maxBytes: number) {
  await execTmux(['pipe-pane', '-o', '-t', sessionName, `head -c ${maxBytes + 1} >> ${shellQuote(paneCapturePath)}`]);
}

async function stopPaneCapture(sessionName: string) {
  await execTmux(['pipe-pane', '-t', sessionName]).catch(() => {
    // The session may already have ended or been terminated.
  });
}

async function waitForPaneCaptureToSettle(paneCapturePath: string) {
  const deadline = Date.now() + PANE_CAPTURE_FLUSH_MAX_WAIT_MS;
  let lastSize = -1;
  let stablePolls = 0;

  while (Date.now() < deadline) {
    const stat = await fs.stat(paneCapturePath).catch(() => null);
    const currentSize = stat?.size ?? 0;
    if (currentSize === lastSize) {
      stablePolls += 1;
      if (stablePolls >= PANE_CAPTURE_FLUSH_STABLE_POLLS) {
        return;
      }
    } else {
      lastSize = currentSize;
      stablePolls = 0;
    }
    await delay(PANE_CAPTURE_FLUSH_POLL_MS);
  }
}

function findTextOverlap(left: string, right: string) {
  const maxLength = Math.min(left.length, right.length);
  for (let length = maxLength; length > 0; length -= 1) {
    if (left.endsWith(right.slice(0, length))) {
      return length;
    }
  }
  return 0;
}

async function appendFallbackOutputIfMissing(paneCapturePath: string, fallbackOutput: string, maxBytes: number) {
  if (!fallbackOutput) {
    return;
  }

  const stat = await fs.stat(paneCapturePath).catch(() => null);
  if (!stat?.size) {
    const content = Buffer.from(fallbackOutput).subarray(0, maxBytes);
    await fs.writeFile(paneCapturePath, content);
    return;
  }

  if (stat.size >= maxBytes) {
    return;
  }

  if (Buffer.byteLength(fallbackOutput) > TERMINAL_CAPTURE_LIMIT) {
    return;
  }

  const fallbackBytes = Buffer.byteLength(fallbackOutput);
  const tailReadSize = Math.min(stat.size, Math.max(TERMINAL_CAPTURE_LIMIT, fallbackBytes * 2));
  const file = await fs.open(paneCapturePath, 'r');
  try {
    const buffer = Buffer.alloc(tailReadSize);
    const { bytesRead } = await file.read(buffer, 0, tailReadSize, stat.size - tailReadSize);
    const tail = buffer.subarray(0, bytesRead).toString('utf8');
    if (tail.includes(fallbackOutput)) {
      return;
    }
    const overlap = findTextOverlap(tail, fallbackOutput);
    const missingSuffix = Buffer.from(fallbackOutput.slice(overlap)).subarray(0, maxBytes - stat.size);
    if (missingSuffix.length) {
      await fs.appendFile(paneCapturePath, missingSuffix);
    }
  } finally {
    await file.close();
  }
}

async function writeTextArtifact(artifactDir: string | undefined, fileName: string, content: string, maxBytes: number) {
  if (!artifactDir) {
    return undefined;
  }
  await fs.mkdir(artifactDir, { recursive: true });
  const artifactPath = path.join(artifactDir, fileName);
  await fs.writeFile(artifactPath, Buffer.from(content).subarray(0, maxBytes));
  return artifactPath;
}

function decodeUtf8Prefix(value: string, maxBytes: number) {
  const decoder = new StringDecoder('utf8');
  return decoder.write(Buffer.from(value).subarray(0, maxBytes));
}

function createLiveOutputTailer(options: {
  sourcePath: string;
  pollIntervalMs?: number;
  onChunk(chunk: string): Promise<void> | void;
}) {
  const decoder = new StringDecoder('utf8');
  let readOffset = 0;
  let readPromise: Promise<void> | null = null;
  let stopped = false;

  const emitChunk = async (chunk: string) => {
    if (chunk) {
      await options.onChunk(chunk);
    }
  };

  const readAvailable = async () => {
    const stat = await fs.stat(options.sourcePath).catch(() => null);
    if (!stat || stat.size <= readOffset) {
      return;
    }

    const file = await fs.open(options.sourcePath, 'r');
    try {
      while (readOffset < stat.size) {
        const length = Math.min(TERMINAL_STREAM_HIGH_WATER_MARK, stat.size - readOffset);
        const buffer = Buffer.alloc(length);
        const { bytesRead } = await file.read(buffer, 0, length, readOffset);
        if (!bytesRead) {
          return;
        }
        readOffset += bytesRead;
        await emitChunk(decoder.write(buffer.subarray(0, bytesRead)));
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
    await emitChunk(decoder.end());
  };
}

export async function writeTerminalArtifactFromFile(options: {
  sourcePath: string;
  artifactDir: string;
  fileName: string;
  maxBytes?: number;
}) {
  await fs.mkdir(options.artifactDir, { recursive: true });
  const artifactPath = path.join(options.artifactDir, options.fileName);
  const maxBytes = getOutputSpoolLimit(options.maxBytes);
  const reader = createReadStream(options.sourcePath, {
    highWaterMark: TERMINAL_STREAM_HIGH_WATER_MARK,
    start: 0,
    end: maxBytes - 1,
  });
  const writer = createWriteStream(artifactPath, {
    flags: 'w',
  });
  try {
    await pipeline(reader, writer);
  } catch (error) {
    await fs.unlink(artifactPath).catch(() => {
      // A failed copy does not produce an artifact owned by the caller.
    });
    throw error;
  }
  const artifactStat = await fs.stat(artifactPath);
  const sourceStat = await fs.stat(options.sourcePath).catch(() => null);
  return {
    artifactPath,
    sizeBytes: artifactStat.size,
    truncated: Boolean(sourceStat && sourceStat.size > artifactStat.size),
  };
}

async function buildTmuxStdoutOutput(options: {
  artifactDir?: string;
  sessionName: string;
  paneCapturePath: string;
  fallbackOutput: string;
  maxBytes: number;
}): Promise<ExecDriverResult['stdout']> {
  const rawPaneStat = await fs.stat(options.paneCapturePath).catch(() => null);
  if (rawPaneStat?.size) {
    if (options.artifactDir) {
      const artifact = await writeTerminalArtifactFromFile({
        sourcePath: options.paneCapturePath,
        artifactDir: options.artifactDir,
        fileName: `${options.sessionName}-terminal.log`,
        maxBytes: options.maxBytes,
      });
      return {
        text: null,
        sizeBytes: artifact.sizeBytes,
        capturedBytes: artifact.sizeBytes,
        truncated: artifact.truncated || rawPaneStat.size > options.maxBytes,
        artifactPath: artifact.artifactPath,
      };
    }
    const file = await fs.open(options.paneCapturePath, 'r');
    try {
      const buffer = Buffer.alloc(Math.min(rawPaneStat.size, TERMINAL_CAPTURE_LIMIT));
      const { bytesRead } = await file.read(buffer, 0, buffer.length, 0);
      return {
        text: buffer.subarray(0, bytesRead).toString('utf8'),
        sizeBytes: bytesRead,
        capturedBytes: bytesRead,
        truncated: rawPaneStat.size > bytesRead,
      };
    } finally {
      await file.close();
    }
  }

  const stdoutText = options.fallbackOutput;
  const artifactPath = await writeTextArtifact(
    options.artifactDir,
    `${options.sessionName}-terminal.log`,
    stdoutText,
    options.maxBytes,
  );
  const capturedText = decodeUtf8Prefix(stdoutText, options.maxBytes);
  const capturedBytes = Buffer.byteLength(capturedText);
  return {
    text: artifactPath ? null : capturedText,
    sizeBytes: Buffer.byteLength(stdoutText),
    capturedBytes,
    truncated: capturedBytes < Buffer.byteLength(stdoutText),
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
  return {
    available: true,
    output: Buffer.byteLength(stdout) > TERMINAL_CAPTURE_LIMIT ? stdout.slice(-TERMINAL_CAPTURE_LIMIT) : stdout,
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
  const prepared = await prepareCommandExecution({
    definition: options.definition,
    args: options.args,
    cwd: options.cwd,
    workspaceRoot: options.workspaceRoot,
    env: options.env,
    timeoutMs: options.timeoutMs,
  });
  const sessionName = getManagedTmuxSessionName(options.runId);
  const startedAt = new Date().toISOString();
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), `${sessionName}-`));
  const exitCodePath = path.join(tempDir, 'exit-code');
  const paneCapturePath = path.join(tempDir, 'pane-output.raw.log');
  const commandScriptPath = path.join(tempDir, 'command.sh');
  const outputFifoPath = options.outputMode === 'structured' ? path.join(tempDir, 'command-output.fifo') : undefined;
  const doneSignalName = getDoneSignalName(sessionName);
  const maxOutputSpoolBytes = getOutputSpoolLimit(options.maxOutputSpoolBytes);
  let terminalStatus: ExecTerminalStatus | null = null;
  let forceKillTimer: ReturnType<typeof setTimeout> | null = null;
  let stopLiveOutputTailer: (() => Promise<void>) | null = null;
  let cancelHandler: (() => void) | null = null;
  let leaseLostHandler: (() => void) | null = null;
  let ownsSessionName = false;
  let persistentArtifactPath: string | undefined;
  let artifactOwnedByCaller = false;

  try {
    await killTmuxSessionIfExists(sessionName);
    ownsSessionName = true;
    const shellCommand = buildShellCommand({
      executable: prepared.executable,
      args: prepared.args,
      env: prepared.env,
      exitCodePath,
      outputFifoPath,
      doneSignalName,
    });
    await fs.writeFile(commandScriptPath, `${shellCommand}\n`, { mode: 0o700 });
    await execTmux([
      'new-session',
      '-d',
      '-s',
      sessionName,
      '-c',
      prepared.cwd,
      '--',
      'sh',
      '-lc',
      'stty -echo 2>/dev/null || true; exec sh',
    ]);
    await execTmux(['set-option', '-t', sessionName, 'remain-on-exit', 'on']).catch(() => {
      // Older tmux versions may reject this after a very short-lived process exits.
    });
    await startPaneCapture(sessionName, paneCapturePath, maxOutputSpoolBytes);
    if (options.onOutputChunk) {
      stopLiveOutputTailer = createLiveOutputTailer({
        sourcePath: paneCapturePath,
        pollIntervalMs: options.liveOutputPollIntervalMs,
        onChunk: options.onOutputChunk,
      });
    }
    cancelHandler = () => {
      terminalStatus = terminalStatus || 'canceled';
      if (isTerminateCancelReason(options.cancelSignal?.reason)) {
        return;
      }
      interruptTmuxSession(sessionName).catch(() => {
        // The session may have already ended.
      });
      forceKillTimer = setTimeout(() => {
        terminateTmuxSession(sessionName).catch(() => {
          // The session may have already ended.
        });
      }, 2000);
    };
    leaseLostHandler = () => {
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

    await sendTmuxInput(sessionName, `exec sh ${shellQuote(commandScriptPath)}`, true);
    await options.onSessionStarted?.({
      backend: 'tmux',
      sessionName,
      startedAt,
    });

    let waitResult: TmuxWaitResult = 'timeout';
    waitResult = await waitForSignalOrPaneEnd(sessionName, doneSignalName, prepared.timeoutMs);
    if (waitResult === 'timeout') {
      terminalStatus = terminalStatus || 'timeout';
      await terminateTmuxSession(sessionName);
    }
    await waitForPaneCaptureToSettle(paneCapturePath);
    await stopPaneCapture(sessionName);
    await waitForPaneCaptureToSettle(paneCapturePath);
    if (stopLiveOutputTailer) {
      await stopLiveOutputTailer();
      stopLiveOutputTailer = null;
    }

    const rawExitCode = await fs.readFile(exitCodePath, 'utf8').catch(() => '');
    const completedExitCode = getExitCode(rawExitCode);
    const completed = waitResult === 'signal';
    const exitCode = completed ? completedExitCode : null;
    const status: ExecTerminalStatus = terminalStatus || (exitCode === 0 ? 'succeeded' : 'failed');
    const snapshot = await captureTmuxSession(sessionName).catch(() => ({
      available: false,
      output: '',
      sessionName,
      capturedAt: new Date().toISOString(),
    }));
    await appendFallbackOutputIfMissing(paneCapturePath, snapshot.output, maxOutputSpoolBytes);
    const stdout = await buildTmuxStdoutOutput({
      artifactDir: options.artifactDir,
      sessionName,
      paneCapturePath,
      fallbackOutput: snapshot.output,
      maxBytes: maxOutputSpoolBytes,
    });
    persistentArtifactPath = stdout.artifactPath;
    const endedAt = new Date().toISOString();
    await options.onSessionEnded?.({
      backend: 'tmux',
      sessionName,
      startedAt,
      endedAt,
      exitCode,
      terminalStatus: status,
    });

    artifactOwnedByCaller = true;
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
    if (forceKillTimer) {
      clearTimeout(forceKillTimer);
    }
    if (cancelHandler) {
      options.cancelSignal?.removeEventListener('abort', cancelHandler);
    }
    if (leaseLostHandler) {
      options.leaseLostSignal?.removeEventListener('abort', leaseLostHandler);
    }
    if (ownsSessionName) {
      await terminateTmuxSession(sessionName).catch(() => {
        // Cleanup must not replace the command result or the original error.
      });
    }
    await stopPaneCapture(sessionName);
    if (stopLiveOutputTailer) {
      await stopLiveOutputTailer().catch(() => {
        // Final artifact capture is authoritative when live tailing cleanup fails.
      });
    }
    if (persistentArtifactPath && !artifactOwnedByCaller) {
      await fs.unlink(persistentArtifactPath).catch(() => {
        // A failed execution cannot hand this artifact to the runner for cleanup.
      });
    }
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {
      // The temp directory only contains raw pane capture and exit-code helpers.
    });
  }
}
