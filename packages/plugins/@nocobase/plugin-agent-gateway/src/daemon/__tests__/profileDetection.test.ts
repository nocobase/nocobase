/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';

import { createCachedProfileDetector, detectAgentProfiles, probeOneCommand } from '../profileDetection';

describe('agent gateway daemon profile detection', () => {
  it('reports opencode, codex, and claude-code without exposing raw execution config', async () => {
    const profiles = await detectAgentProfiles({
      probeCommand: async (candidates) => {
        if (candidates.includes('opencode')) {
          return {
            available: true,
            command: 'opencode',
            version: 'opencode 1.2.3',
            authStatus: 'ok',
          };
        }
        return {
          available: false,
          command: candidates[0],
          error: 'not installed',
        };
      },
    });

    expect(profiles.map((profile) => profile.profileKey)).toEqual(['opencode', 'codex', 'claude-code']);
    expect(profiles.find((profile) => profile.profileKey === 'opencode')).toMatchObject({
      provider: 'opencode',
      status: 'active',
      driver: 'exec',
      capabilities: {
        commandKey: 'opencode',
        detectedCommand: 'opencode',
        version: 'opencode 1.2.3',
        structuredEvents: true,
        terminalOutput: true,
        resumeSession: false,
        artifacts: true,
      },
    });
    expect(profiles.find((profile) => profile.profileKey === 'codex')?.status).toBe('missing');
    expect(profiles.find((profile) => profile.profileKey === 'claude-code')?.status).toBe('missing');
    expect(JSON.stringify(profiles)).not.toContain('commandPath');
    expect(JSON.stringify(profiles)).not.toContain('"cwd"');
    expect(JSON.stringify(profiles)).not.toContain('"env"');
  });

  it('reuses detected profiles until the cache expires', async () => {
    let now = 1000;
    let probeCalls = 0;
    const detectProfiles = createCachedProfileDetector({
      refreshIntervalMs: 100,
      now: () => now,
      probeCommand: async () => {
        probeCalls += 1;
        return {
          available: false,
        };
      },
    });

    const first = await detectProfiles();
    const cached = await detectProfiles();
    expect(cached).toBe(first);
    expect(probeCalls).toBe(3);

    now += 100;
    const refreshed = await detectProfiles();
    expect(refreshed).not.toBe(first);
    expect(probeCalls).toBe(6);
  });

  it('coalesces concurrent profile detection calls', async () => {
    let releaseProbe: () => void = () => {};
    const probeGate = new Promise<void>((resolve) => {
      releaseProbe = resolve;
    });
    let probeCalls = 0;
    const detectProfiles = createCachedProfileDetector({
      probeCommand: async () => {
        probeCalls += 1;
        await probeGate;
        return {
          available: false,
        };
      },
    });

    const first = detectProfiles();
    const second = detectProfiles();
    releaseProbe();

    const [firstProfiles, secondProfiles] = await Promise.all([first, second]);
    expect(secondProfiles).toBe(firstProfiles);
    expect(probeCalls).toBe(3);
  });

  it('bounds version output and terminates probes that exceed the timeout', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ag-profile-probe-'));
    const outputCommand = path.join(tempDir, 'large-version');
    const timeoutCommand = path.join(tempDir, 'slow-version');
    const pidPath = path.join(tempDir, 'slow-version.pid');
    try {
      await fs.writeFile(outputCommand, '#!/bin/sh\nprintf "%04096d" 0 | tr "0" "x"\n', { mode: 0o755 });
      await fs.writeFile(
        timeoutCommand,
        [
          '#!/bin/sh',
          `printf '%s' "$$" > ${JSON.stringify(pidPath)}`,
          "trap '' TERM",
          'while :; do sleep 1; done',
          '',
        ].join('\n'),
        { mode: 0o755 },
      );

      const bounded = await probeOneCommand(outputCommand, {
        maxOutputBytes: 64,
      });
      expect(bounded).toMatchObject({
        available: true,
        version: 'x'.repeat(64),
      });

      const timedOut = await probeOneCommand(timeoutCommand, {
        timeoutMs: 50,
        forceKillDelayMs: 20,
      });
      expect(timedOut).toMatchObject({
        available: false,
        error: 'Command probe timed out after 50ms',
      });
      const childPid = Number(await fs.readFile(pidPath, 'utf8'));
      expect(() => process.kill(childPid, 0)).toThrow();

      const controller = new AbortController();
      const abortedPromise = probeOneCommand(timeoutCommand, {
        timeoutMs: 10_000,
        forceKillDelayMs: 20,
        signal: controller.signal,
      });
      await new Promise((resolve) => setTimeout(resolve, 20));
      controller.abort();
      await expect(abortedPromise).resolves.toMatchObject({
        available: false,
        error: 'Command probe aborted',
      });
      const abortedChildPid = Number(await fs.readFile(pidPath, 'utf8'));
      expect(() => process.kill(abortedChildPid, 0)).toThrow();
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });
});
