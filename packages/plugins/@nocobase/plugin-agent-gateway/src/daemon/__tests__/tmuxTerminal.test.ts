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
});
