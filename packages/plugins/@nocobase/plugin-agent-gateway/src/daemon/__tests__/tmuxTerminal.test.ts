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
  terminateTmuxSession,
  writeRedactedArtifactFromFile,
} from '../tmuxTerminal';

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

function execTmuxOutput(args: string[]) {
  return new Promise<string>((resolve, reject) => {
    execFile('tmux', args, (error, stdout) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(stdout);
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

  it('returns failed status and the process exit code for non-zero commands', async () => {
    if (!tmuxReady) {
      return;
    }

    const runId = `tmux-exit-${Date.now()}`;
    try {
      const result = await executeTmuxCommand({
        runId,
        definition: {
          commandKey: 'node',
          executable: process.execPath,
        },
        args: ['-e', 'console.error("tmux failure marker"); process.exit(2);'],
        cwd: process.cwd(),
        workspaceRoot: process.cwd(),
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

  it('writes redacted tmux artifacts and cleans internal raw capture files', async () => {
    if (!tmuxReady) {
      return;
    }

    const runId = `tmux-redact-${Date.now()}`;
    const sessionName = getManagedTmuxSessionName(runId);
    try {
      const result = await executeTmuxCommand({
        runId,
        definition: {
          commandKey: 'node',
          executable: process.execPath,
        },
        args: [
          '-e',
          [
            'console.log("visible tmux line");',
            'console.log("Authorization: Bearer TMUX_ARTIFACT_SECRET");',
            'console.log("command=TMUX_COMMAND_SECRET cwd=/tmp/TMUX_CWD_SECRET env.SECRET=TMUX_ENV_SECRET");',
          ].join(''),
        ],
        cwd: process.cwd(),
        workspaceRoot: process.cwd(),
        timeoutMs: 5000,
        artifactDir: tempDir,
      });

      expect(result.status).toBe('succeeded');
      expect(result.stdout.artifactPath).toBeTruthy();
      const artifactText = await fs.readFile(String(result.stdout.artifactPath), 'utf8');
      expect(artifactText).toContain('visible tmux line');
      expect(artifactText).toContain('Authorization: [REDACTED]');
      expect(artifactText).not.toContain('TMUX_ARTIFACT_SECRET');
      expect(artifactText).not.toContain('TMUX_COMMAND_SECRET');
      expect(artifactText).not.toContain('TMUX_CWD_SECRET');
      expect(artifactText).not.toContain('TMUX_ENV_SECRET');

      const tempEntries = await fs.readdir(os.tmpdir());
      expect(tempEntries.filter((entry) => entry.startsWith(`${sessionName}-`))).toHaveLength(0);
    } finally {
      await terminateTmuxSession(sessionName).catch(() => {
        // The completed session may already have been cleaned up by the test environment.
      });
    }
  });

  it('does not leak oversized bearer token tails when redacting tmux artifacts', async () => {
    if (!tmuxReady) {
      return;
    }

    const runId = `tmux-long-redact-${Date.now()}`;
    const sessionName = getManagedTmuxSessionName(runId);
    try {
      const result = await executeTmuxCommand({
        runId,
        definition: {
          commandKey: 'node',
          executable: process.execPath,
        },
        args: [
          '-e',
          [
            'const token = `TMUX_LONG_SECRET_${"x".repeat(90000)}_TAIL`;',
            'console.log(`Authorization: Bearer ${token}`);',
            'console.log("visible after long token");',
          ].join(''),
        ],
        cwd: process.cwd(),
        workspaceRoot: process.cwd(),
        timeoutMs: 5000,
        artifactDir: tempDir,
      });

      expect(result.status).toBe('succeeded');
      expect(result.stdout.artifactPath).toBeTruthy();
      const artifactText = await fs.readFile(String(result.stdout.artifactPath), 'utf8');
      expect(artifactText).toContain('[REDACTED_OVERSIZED_TERMINAL_LINE]');
      expect(artifactText).toContain('visible after long token');
      expect(artifactText).not.toContain('TMUX_LONG_SECRET_');
      expect(artifactText).not.toContain('_TAIL');
      expect(artifactText).not.toContain('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
    } finally {
      await terminateTmuxSession(sessionName).catch(() => {
        // The completed session may already have been cleaned up by the test environment.
      });
    }
  });

  it('redacts an oversized terminal line before writing it when the newline arrives later', async () => {
    const sourcePath = path.join(tempDir, 'raw-terminal.log');
    const longSecret = `ARBITRARY_TERMINAL_SECRET_${'x'.repeat(70 * 1024)}_TAIL`;
    await fs.writeFile(sourcePath, `before boundary\n${longSecret}\nafter boundary\n`);

    const artifactPath = await writeRedactedArtifactFromFile({
      sourcePath,
      artifactDir: tempDir,
      fileName: 'redacted-terminal.log',
    });
    const artifactText = await fs.readFile(artifactPath, 'utf8');

    expect(artifactText).toContain('before boundary');
    expect(artifactText).toContain('[REDACTED_OVERSIZED_TERMINAL_LINE]');
    expect(artifactText).toContain('after boundary');
    expect(artifactText).not.toContain('ARBITRARY_TERMINAL_SECRET_');
    expect(artifactText).not.toContain('_TAIL');
    expect(artifactText).not.toContain('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
  });

  it('emits redacted live output chunks before the tmux command exits', async () => {
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
        definition: {
          commandKey: 'node',
          executable: process.execPath,
        },
        args: [
          '-e',
          [
            'console.log("AGENT_GATEWAY_TMUX_LIVE_1");',
            'setTimeout(() => console.log("Authorization: Bearer TMUX_LIVE_SECRET"), 250);',
            'setTimeout(() => console.log("AGENT_GATEWAY_TMUX_LIVE_DONE"), 500);',
          ].join(''),
        ],
        cwd: process.cwd(),
        workspaceRoot: process.cwd(),
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
      expect(joined).toContain('Authorization: [REDACTED]');
      expect(joined).not.toContain('TMUX_LIVE_SECRET');
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
        definition: {
          commandKey: 'sh',
          executable: 'sh',
        },
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
        workspaceRoot: process.cwd(),
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
        definition: {
          commandKey: 'sh',
          executable: 'sh',
        },
        args: ['-lc', 'printf "AGENT_GATEWAY_TMUX_PARTIAL"; sleep 0.4; printf "_DONE\\n"'],
        cwd: process.cwd(),
        workspaceRoot: process.cwd(),
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

  it('does not leak a sensitive key split across partial-line live flushes', async () => {
    if (!tmuxReady) {
      return;
    }

    const runId = `tmux-split-secret-${Date.now()}`;
    const sessionName = getManagedTmuxSessionName(runId);
    const chunks: string[] = [];
    try {
      const result = await executeTmuxCommand({
        runId,
        definition: {
          commandKey: 'sh',
          executable: 'sh',
        },
        args: ['-lc', 'printf "to"; sleep 0.2; printf "ken=TMUX_SPLIT_SECRET\\n"'],
        cwd: process.cwd(),
        workspaceRoot: process.cwd(),
        timeoutMs: 5000,
        artifactDir: tempDir,
        liveOutputPollIntervalMs: 25,
        onOutputChunk: async (chunk) => {
          chunks.push(chunk);
        },
      });

      expect(result.status).toBe('succeeded');
      const liveOutput = chunks.join('');
      expect(liveOutput).toContain('token=[REDACTED]');
      expect(liveOutput).not.toContain('TMUX_SPLIT_SECRET');
      expect(result.stdout.artifactPath).toBeTruthy();
      const artifactText = await fs.readFile(String(result.stdout.artifactPath), 'utf8');
      expect(artifactText).toContain('token=[REDACTED]');
      expect(artifactText).not.toContain('TMUX_SPLIT_SECRET');
    } finally {
      await terminateTmuxSession(sessionName).catch(() => {
        // The completed session may already have been removed.
      });
    }
  });

  it('does not leave a live interactive shell after the tmux command completes', async () => {
    if (!tmuxReady) {
      return;
    }

    const runId = `tmux-no-shell-${Date.now()}`;
    const sessionName = getManagedTmuxSessionName(runId);
    try {
      const result = await executeTmuxCommand({
        runId,
        definition: {
          commandKey: 'sh',
          executable: 'sh',
        },
        args: ['-lc', 'printf "AGENT_GATEWAY_TMUX_NO_LIVE_SHELL\\n"'],
        cwd: process.cwd(),
        workspaceRoot: process.cwd(),
        timeoutMs: 5000,
        artifactDir: tempDir,
      });

      expect(result.status).toBe('succeeded');
      const paneState = await execTmuxOutput([
        'list-panes',
        '-t',
        sessionName,
        '-F',
        '#{pane_dead}:#{pane_current_command}',
      ]);
      expect(paneState.trim()).toMatch(/^1:/);
    } finally {
      await terminateTmuxSession(sessionName).catch(() => {
        // The completed session may already have been removed.
      });
    }
  });
});
