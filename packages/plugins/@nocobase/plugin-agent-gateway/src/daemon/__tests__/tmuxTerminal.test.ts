/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { execFile } from 'child_process';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';

import {
  executeTmuxCommand,
  getManagedTmuxSessionName,
  TMUX_TERMINATE_CANCEL_REASON,
  terminateTmuxSession,
  writeTerminalArtifactFromFile,
} from '../tmuxTerminal';
import type { ExecutionPolicyDefinition } from '../types';

function createExecutionPolicy(
  executable: string,
  workspaceRoot: string,
  envKeys: string[] = [],
): ExecutionPolicyDefinition {
  return {
    executionPolicyKey: `tmux-test-${path.basename(executable)}`,
    provider: 'generic-cli',
    executable,
    workspaceRoot,
    envKeys,
    maxTimeoutMs: 10_000,
  };
}

function execTmux(args: string[]) {
  return new Promise<void>((resolve, reject) => {
    execFile('tmux', args, (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

async function hasTmux() {
  try {
    await execTmux(['-V']);
    return true;
  } catch {
    return false;
  }
}

async function tmuxSessionExists(sessionName: string) {
  try {
    await execTmux(['has-session', '-t', sessionName]);
    return true;
  } catch {
    return false;
  }
}

describe('agent gateway tmux terminal driver', () => {
  let tempDir: string;
  let tmuxReady = false;

  beforeAll(async () => {
    tmuxReady = await hasTmux();
  });

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ag-tmux-terminal-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('does not inherit environment variables outside the canonical policy allowlist', async () => {
    if (!tmuxReady) {
      return;
    }
    const previousValue = process.env.NOT_ALLOWED;
    process.env.NOT_ALLOWED = 'secret';
    try {
      const result = await executeTmuxCommand({
        runId: `tmux-env-rejected-${Date.now()}`,
        policy: createExecutionPolicy(process.execPath, tempDir),
        args: ['-e', 'console.log(process.env.NOT_ALLOWED || "missing")'],
        cwd: tempDir,
        timeoutMs: 5000,
        artifactDir: tempDir,
      });
      const output = result.stdout.artifactPath
        ? await fs.readFile(result.stdout.artifactPath, 'utf8')
        : result.stdout.text || '';
      expect(output).toContain('missing');
      expect(output).not.toContain('secret');
    } finally {
      if (previousValue === undefined) {
        delete process.env.NOT_ALLOWED;
      } else {
        process.env.NOT_ALLOWED = previousValue;
      }
    }
  });

  it('returns failed status and the process exit code for non-zero commands', async () => {
    if (!tmuxReady) {
      return;
    }

    const runId = `tmux-exit-${Date.now()}`;
    try {
      const result = await executeTmuxCommand({
        runId,
        policy: createExecutionPolicy(process.execPath, process.cwd()),
        args: ['-e', 'console.error("tmux failure marker"); process.exit(2);'],
        cwd: process.cwd(),
        timeoutMs: 5000,
        artifactDir: tempDir,
      });

      expect(result.status).toBe('failed');
      expect(result.exitCode).toBe(2);
      expect(result.stdout.sizeBytes).toBeGreaterThan(0);
    } finally {
      await terminateTmuxSession(`ag-run-${runId}`).catch(() => {
        // The completed session may already have been cleaned up by the test environment.
      });
    }
  });

  it('writes complete tmux artifacts and cleans internal raw capture files', async () => {
    if (!tmuxReady) {
      return;
    }

    const runId = `tmux-redact-${Date.now()}`;
    const sessionName = getManagedTmuxSessionName(runId);
    try {
      const result = await executeTmuxCommand({
        runId,
        policy: createExecutionPolicy(process.execPath, process.cwd()),
        args: [
          '-e',
          [
            'console.log("visible tmux line");',
            'console.log("Authorization: Bearer TMUX_ARTIFACT_SECRET");',
            'console.log("command=TMUX_COMMAND_SECRET cwd=/tmp/TMUX_CWD_SECRET env.SECRET=TMUX_ENV_SECRET");',
          ].join(''),
        ],
        cwd: process.cwd(),
        timeoutMs: 5000,
        artifactDir: tempDir,
      });

      expect(result.status).toBe('succeeded');
      expect(result.stdout.artifactPath).toBeTruthy();
      const artifactText = await fs.readFile(String(result.stdout.artifactPath), 'utf8');
      expect(artifactText).toContain('visible tmux line');
      expect(artifactText).toContain('Authorization: Bearer TMUX_ARTIFACT_SECRET');
      expect(artifactText).toContain('TMUX_COMMAND_SECRET');
      expect(artifactText).toContain('TMUX_CWD_SECRET');
      expect(artifactText).toContain('TMUX_ENV_SECRET');

      const tempEntries = await fs.readdir(os.tmpdir());
      expect(tempEntries.filter((entry) => entry.startsWith(`${sessionName}-`))).toHaveLength(0);
    } finally {
      await terminateTmuxSession(sessionName).catch(() => {
        // The completed session may already have been cleaned up by the test environment.
      });
    }
  });

  it('keeps oversized terminal lines intact in tmux artifacts', async () => {
    if (!tmuxReady) {
      return;
    }

    const runId = `tmux-long-redact-${Date.now()}`;
    const sessionName = getManagedTmuxSessionName(runId);
    try {
      const result = await executeTmuxCommand({
        runId,
        policy: createExecutionPolicy(process.execPath, process.cwd()),
        args: [
          '-e',
          [
            'const token = `TMUX_LONG_SECRET_${"x".repeat(90000)}_TAIL`;',
            'console.log(`Authorization: Bearer ${token}`);',
            'console.log("visible after long token");',
          ].join(''),
        ],
        cwd: process.cwd(),
        timeoutMs: 5000,
        artifactDir: tempDir,
      });

      expect(result.status).toBe('succeeded');
      expect(result.stdout.artifactPath).toBeTruthy();
      const artifactText = await fs.readFile(String(result.stdout.artifactPath), 'utf8');
      expect(artifactText).toContain('TMUX_LONG_SECRET_');
      expect(artifactText).toContain('_TAIL');
      expect(artifactText).toContain('visible after long token');
      expect(artifactText).toContain('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
    } finally {
      await terminateTmuxSession(sessionName).catch(() => {
        // The completed session may already have been cleaned up by the test environment.
      });
    }
  });

  it('caps tmux pipe-pane output before copying the persistent artifact', async () => {
    if (!tmuxReady) {
      return;
    }

    const runId = `tmux-spool-limit-${Date.now()}`;
    const sessionName = getManagedTmuxSessionName(runId);
    try {
      const result = await executeTmuxCommand({
        runId,
        policy: createExecutionPolicy(process.execPath, process.cwd()),
        args: ['-e', 'process.stdout.write("x".repeat(16 * 1024));'],
        cwd: process.cwd(),
        timeoutMs: 5000,
        artifactDir: tempDir,
        maxOutputSpoolBytes: 1024,
      });

      expect(result.status).toBe('succeeded');
      expect(result.stdout).toMatchObject({
        capturedBytes: 1024,
        truncated: true,
      });
      expect((await fs.stat(String(result.stdout.artifactPath))).size).toBe(1024);
    } finally {
      await terminateTmuxSession(sessionName).catch(() => {
        // The completed session may already have been cleaned up by the test environment.
      });
    }
  });

  it('copies terminal artifact files without content redaction', async () => {
    const sourcePath = path.join(tempDir, 'raw-terminal.log');
    const longSecret = `ARBITRARY_TERMINAL_SECRET_${'x'.repeat(70 * 1024)}_TAIL`;
    await fs.writeFile(sourcePath, `before boundary\n${longSecret}\nafter boundary\n`);

    const artifact = await writeTerminalArtifactFromFile({
      sourcePath,
      artifactDir: tempDir,
      fileName: 'terminal.log',
    });
    const artifactText = await fs.readFile(artifact.artifactPath, 'utf8');

    expect(artifactText).toContain('before boundary');
    expect(artifactText).toContain('ARBITRARY_TERMINAL_SECRET_');
    expect(artifactText).toContain('_TAIL');
    expect(artifactText).toContain('after boundary');
    expect(artifactText).toContain('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
  });

  it('caps terminal artifact copies and reports truncation', async () => {
    const sourcePath = path.join(tempDir, 'bounded-terminal.log');
    await fs.writeFile(sourcePath, 'x'.repeat(4096));

    const artifact = await writeTerminalArtifactFromFile({
      sourcePath,
      artifactDir: tempDir,
      fileName: 'bounded-copy.log',
      maxBytes: 1024,
    });

    expect(artifact).toMatchObject({
      sizeBytes: 1024,
      truncated: true,
    });
    expect((await fs.stat(artifact.artifactPath)).size).toBe(1024);
  });

  it('does not report truncation when a terminal artifact exactly matches the limit', async () => {
    const sourcePath = path.join(tempDir, 'exact-terminal.log');
    await fs.writeFile(sourcePath, 'x'.repeat(1024));

    const artifact = await writeTerminalArtifactFromFile({
      sourcePath,
      artifactDir: tempDir,
      fileName: 'exact-copy.log',
      maxBytes: 1024,
    });

    expect(artifact).toMatchObject({
      sizeBytes: 1024,
      truncated: false,
    });
  });

  it('rejects promptly when the terminal artifact copy cannot be written', async () => {
    const hasDevFull = await fs
      .access('/dev/full')
      .then(() => true)
      .catch(() => false);
    if (!hasDevFull) {
      return;
    }
    const sourcePath = path.join(tempDir, 'copy-error-source.log');
    const artifactPath = path.join(tempDir, 'copy-error.log');
    await fs.writeFile(sourcePath, 'x'.repeat(4096));
    await fs.symlink('/dev/full', artifactPath);
    const startedAt = Date.now();

    await expect(
      writeTerminalArtifactFromFile({
        sourcePath,
        artifactDir: tempDir,
        fileName: 'copy-error.log',
      }),
    ).rejects.toThrow();

    expect(Date.now() - startedAt).toBeLessThan(2000);
    await expect(fs.access(artifactPath)).rejects.toThrow();
  });

  it('emits complete live output chunks before the tmux command exits', async () => {
    if (!tmuxReady) {
      return;
    }

    const runId = `tmux-live-${Date.now()}`;
    const sessionName = getManagedTmuxSessionName(runId);
    const chunks: string[] = [];
    let resolveFirstChunk: (value: string) => void = () => {};
    const firstChunk = new Promise<string>((resolve) => {
      resolveFirstChunk = resolve;
    });
    try {
      const command = executeTmuxCommand({
        runId,
        policy: createExecutionPolicy(process.execPath, process.cwd()),
        args: [
          '-e',
          [
            'console.log("AGENT_GATEWAY_TMUX_LIVE_1");',
            'setTimeout(() => console.log("Authorization: Bearer TMUX_LIVE_SECRET"), 250);',
            'setTimeout(() => console.log("AGENT_GATEWAY_TMUX_LIVE_DONE"), 500);',
          ].join(''),
        ],
        cwd: process.cwd(),
        timeoutMs: 5000,
        artifactDir: tempDir,
        liveOutputPollIntervalMs: 25,
        onOutputChunk: async (chunk) => {
          chunks.push(chunk);
          resolveFirstChunk(chunk);
        },
      });

      const first = await Promise.race([firstChunk, command.then(() => 'completed-before-live-output')]);
      expect(first).not.toBe('completed-before-live-output');
      expect(first).toContain('AGENT_GATEWAY_TMUX_LIVE_1');

      const result = await command;
      expect(result.status).toBe('succeeded');
      const joined = chunks.join('');
      expect(joined).toContain('AGENT_GATEWAY_TMUX_LIVE_DONE');
      expect(joined).toContain('Authorization: Bearer TMUX_LIVE_SECRET');
    } finally {
      await terminateTmuxSession(sessionName).catch(() => {
        // The completed session may already have been removed.
      });
    }
  });

  it('captures immediate first-line output in both live stream and artifact', async () => {
    if (!tmuxReady) {
      return;
    }

    const runId = `tmux-fast-${Date.now()}`;
    const sessionName = getManagedTmuxSessionName(runId);
    const chunks: string[] = [];
    try {
      const result = await executeTmuxCommand({
        runId,
        policy: createExecutionPolicy('sh', process.cwd()),
        args: [
          '-lc',
          [
            'printf "AGENT_GATEWAY_TMUX_FAST_1\\n";',
            'sleep 0.1;',
            'printf "AGENT_GATEWAY_TMUX_FAST_2\\n";',
            'printf "AGENT_GATEWAY_TMUX_FAST_DONE\\n";',
          ].join(''),
        ],
        cwd: process.cwd(),
        timeoutMs: 5000,
        artifactDir: tempDir,
        liveOutputPollIntervalMs: 10,
        onOutputChunk: async (chunk) => {
          chunks.push(chunk);
        },
      });

      expect(result.status).toBe('succeeded');
      const liveOutput = chunks.join('');
      expect(liveOutput).toContain('AGENT_GATEWAY_TMUX_FAST_1');
      expect(liveOutput).toContain('AGENT_GATEWAY_TMUX_FAST_2');
      expect(liveOutput).toContain('AGENT_GATEWAY_TMUX_FAST_DONE');

      expect(result.stdout.artifactPath).toBeTruthy();
      const artifactText = await fs.readFile(String(result.stdout.artifactPath), 'utf8');
      expect(artifactText).toContain('AGENT_GATEWAY_TMUX_FAST_1');
      expect(artifactText).toContain('AGENT_GATEWAY_TMUX_FAST_2');
      expect(artifactText).toContain('AGENT_GATEWAY_TMUX_FAST_DONE');
    } finally {
      await terminateTmuxSession(sessionName).catch(() => {
        // The completed session may already have been removed.
      });
    }
  });

  it('prepends the cwd node_modules bin directory to PATH for tmux commands', async () => {
    if (!tmuxReady) {
      return;
    }

    const workspace = path.join(tempDir, 'workspace');
    const localBin = path.join(workspace, 'node_modules', '.bin');
    await fs.mkdir(localBin, { recursive: true });
    const localTool = path.join(localBin, 'ag-local-tmux-tool');
    await fs.writeFile(localTool, '#!/bin/sh\nprintf "AG_LOCAL_TMUX_TOOL_OK:%s\\n" "$PATH"\n', { mode: 0o755 });

    const runId = `tmux-local-bin-${Date.now()}`;
    const sessionName = getManagedTmuxSessionName(runId);
    try {
      const result = await executeTmuxCommand({
        runId,
        policy: createExecutionPolicy('ag-local-tmux-tool', workspace),
        cwd: workspace,
        timeoutMs: 5000,
        artifactDir: tempDir,
      });
      const output = result.stdout.artifactPath
        ? await fs.readFile(result.stdout.artifactPath, 'utf8')
        : result.stdout.text || '';

      expect(result.status).toBe('succeeded');
      expect(output).toContain('AG_LOCAL_TMUX_TOOL_OK');
      expect(output).toContain(localBin);
    } finally {
      await terminateTmuxSession(sessionName).catch(() => {
        // The completed session may already have been removed.
      });
    }
  });

  it('emits safe partial-line live output before the tmux command exits', async () => {
    if (!tmuxReady) {
      return;
    }

    const runId = `tmux-partial-${Date.now()}`;
    const sessionName = getManagedTmuxSessionName(runId);
    const chunks: string[] = [];
    let resolvePartialChunk: (value: string) => void = () => {};
    const partialChunk = new Promise<string>((resolve) => {
      resolvePartialChunk = resolve;
    });
    try {
      const command = executeTmuxCommand({
        runId,
        policy: createExecutionPolicy('sh', process.cwd()),
        args: ['-lc', 'printf "AGENT_GATEWAY_TMUX_PARTIAL"; sleep 0.4; printf "_DONE\\n"'],
        cwd: process.cwd(),
        timeoutMs: 5000,
        artifactDir: tempDir,
        liveOutputPollIntervalMs: 25,
        onOutputChunk: async (chunk) => {
          chunks.push(chunk);
          if (chunk.includes('AGENT_GATEWAY_TMUX_PARTIAL')) {
            resolvePartialChunk(chunk);
          }
        },
      });

      const first = await Promise.race([partialChunk, command.then(() => 'completed-before-partial-output')]);
      expect(first).not.toBe('completed-before-partial-output');
      expect(first).toContain('AGENT_GATEWAY_TMUX_PARTIAL');
      const result = await command;
      expect(result.status).toBe('succeeded');
      expect(chunks.join('')).toContain('_DONE');
    } finally {
      await terminateTmuxSession(sessionName).catch(() => {
        // The completed session may already have been removed.
      });
    }
  });

  it('streams partial-line live output without redaction', async () => {
    if (!tmuxReady) {
      return;
    }

    const runId = `tmux-split-secret-${Date.now()}`;
    const sessionName = getManagedTmuxSessionName(runId);
    const chunks: string[] = [];
    try {
      const result = await executeTmuxCommand({
        runId,
        policy: createExecutionPolicy('sh', process.cwd()),
        args: ['-lc', 'printf "to"; sleep 0.2; printf "ken=TMUX_SPLIT_SECRET\\n"'],
        cwd: process.cwd(),
        timeoutMs: 5000,
        artifactDir: tempDir,
        liveOutputPollIntervalMs: 25,
        onOutputChunk: async (chunk) => {
          chunks.push(chunk);
        },
      });

      expect(result.status).toBe('succeeded');
      const liveOutput = chunks.join('');
      expect(liveOutput).toContain('token=TMUX_SPLIT_SECRET');
      expect(result.stdout.artifactPath).toBeTruthy();
      const artifactText = await fs.readFile(String(result.stdout.artifactPath), 'utf8');
      expect(artifactText).toContain('token=TMUX_SPLIT_SECRET');
    } finally {
      await terminateTmuxSession(sessionName).catch(() => {
        // The completed session may already have been removed.
      });
    }
  });

  it('removes the managed tmux session after the command completes', async () => {
    if (!tmuxReady) {
      return;
    }

    const runId = `tmux-no-shell-${Date.now()}`;
    const sessionName = getManagedTmuxSessionName(runId);
    try {
      const result = await executeTmuxCommand({
        runId,
        policy: createExecutionPolicy('sh', process.cwd()),
        args: ['-lc', 'printf "AGENT_GATEWAY_TMUX_NO_LIVE_SHELL\\n"'],
        cwd: process.cwd(),
        timeoutMs: 5000,
        artifactDir: tempDir,
      });

      expect(result.status).toBe('succeeded');
      expect(await tmuxSessionExists(sessionName)).toBe(false);
    } finally {
      await terminateTmuxSession(sessionName).catch(() => {
        // The completed session may already have been removed.
      });
    }
  });

  it('removes the managed tmux session when onSessionStarted fails', async () => {
    if (!tmuxReady) {
      return;
    }

    const runId = `tmux-start-callback-failure-${Date.now()}`;
    const sessionName = getManagedTmuxSessionName(runId);
    await expect(
      executeTmuxCommand({
        runId,
        policy: createExecutionPolicy('sh', process.cwd()),
        args: ['-lc', 'sleep 30'],
        cwd: process.cwd(),
        timeoutMs: 5000,
        artifactDir: tempDir,
        onSessionStarted: async () => {
          throw new Error('session metadata update failed');
        },
      }),
    ).rejects.toThrow('session metadata update failed');

    expect(await tmuxSessionExists(sessionName)).toBe(false);
  });

  it('direct terminate cancellation does not send Ctrl-C before killing the tmux session', async () => {
    if (!tmuxReady) {
      return;
    }

    const runId = `tmux-direct-terminate-${Date.now()}`;
    const sessionName = getManagedTmuxSessionName(runId);
    const cancelController = new AbortController();
    const startMarkerPath = path.join(tempDir, `${runId}-start-marker.txt`);
    const interruptMarkerPath = path.join(tempDir, `${runId}-interrupt-marker.txt`);
    const previousStartMarker = process.env.AGW_START_MARKER;
    const previousInterruptMarker = process.env.AGW_INT_MARKER;
    process.env.AGW_START_MARKER = startMarkerPath;
    process.env.AGW_INT_MARKER = interruptMarkerPath;
    try {
      const result = await executeTmuxCommand({
        runId,
        policy: createExecutionPolicy('sh', process.cwd(), ['AGW_START_MARKER', 'AGW_INT_MARKER']),
        args: [
          '-lc',
          [
            'trap \'printf "INT\\n" > "$AGW_INT_MARKER"\' INT;',
            'printf "START\\n" > "$AGW_START_MARKER";',
            'printf "AGENT_GATEWAY_TMUX_DIRECT_TERMINATE_START\\n";',
            'sleep 30;',
            'printf "AGENT_GATEWAY_TMUX_DIRECT_TERMINATE_DONE\\n";',
          ].join(' '),
        ],
        cwd: process.cwd(),
        timeoutMs: 10_000,
        artifactDir: tempDir,
        cancelSignal: cancelController.signal,
        onSessionStarted: async ({ sessionName }) => {
          for (let attempt = 0; attempt < 20; attempt += 1) {
            const startMarker = await fs.readFile(startMarkerPath, 'utf8').catch(() => '');
            if (startMarker.includes('START')) {
              break;
            }
            await new Promise((resolve) => setTimeout(resolve, 50));
          }
          cancelController.abort(TMUX_TERMINATE_CANCEL_REASON);
          await terminateTmuxSession(sessionName);
        },
      });

      expect(result.status).toBe('canceled');
      expect(result.stdout.text || '').not.toContain('AGENT_GATEWAY_TMUX_DIRECT_TERMINATE_DONE');
      const startMarker = await fs.readFile(startMarkerPath, 'utf8').catch(() => '');
      expect(startMarker).toContain('START');
      const interruptMarker = await fs.readFile(interruptMarkerPath, 'utf8').catch(() => '');
      expect(interruptMarker).toBe('');
    } finally {
      if (previousStartMarker === undefined) {
        delete process.env.AGW_START_MARKER;
      } else {
        process.env.AGW_START_MARKER = previousStartMarker;
      }
      if (previousInterruptMarker === undefined) {
        delete process.env.AGW_INT_MARKER;
      } else {
        process.env.AGW_INT_MARKER = previousInterruptMarker;
      }
      await terminateTmuxSession(sessionName).catch(() => {
        // The test may already have killed the session.
      });
    }
  });

  it('returns promptly when the tmux pane dies before the done signal is emitted', async () => {
    if (!tmuxReady) {
      return;
    }

    const runId = `tmux-pane-dead-${Date.now()}`;
    const sessionName = getManagedTmuxSessionName(runId);
    const startedAt = Date.now();
    try {
      const result = await executeTmuxCommand({
        runId,
        policy: createExecutionPolicy('sh', process.cwd()),
        args: ['-lc', 'printf "AGENT_GATEWAY_TMUX_PANE_DEAD_START\\n"; sleep 30'],
        cwd: process.cwd(),
        timeoutMs: 10_000,
        artifactDir: tempDir,
        onSessionStarted: async ({ sessionName }) => {
          setTimeout(() => {
            execTmux(['kill-session', '-t', sessionName]).catch(() => {
              // The session may already have exited.
            });
          }, 500);
        },
      });

      expect(Date.now() - startedAt).toBeLessThan(5000);
      expect(result.status).toBe('failed');
      expect(result.exitCode).toBeNull();
      expect(result.stdout.sizeBytes).toBeGreaterThan(0);
    } finally {
      await terminateTmuxSession(sessionName).catch(() => {
        // The completed session may already have been removed.
      });
    }
  });
});
