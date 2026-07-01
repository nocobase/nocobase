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

import { executeTmuxCommand, terminateTmuxSession } from '../tmuxTerminal';

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
});
