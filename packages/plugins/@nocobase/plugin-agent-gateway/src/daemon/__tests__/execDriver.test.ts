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

import { executePolicyCommand, executeCommand, prepareCommandExecution } from '../execDriver';
import { ExecutionPolicyDefinition } from '../types';

describe('agent gateway daemon exec driver', () => {
  let tempDir: string;
  let workspace: string;
  let policy: ExecutionPolicyDefinition;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ag-exec-driver-'));
    workspace = path.join(tempDir, 'workspace');
    await fs.mkdir(workspace, { recursive: true });
    policy = {
      executionPolicyKey: 'node',
      provider: 'generic-cli',
      executable: process.execPath,
      workspaceRoot: workspace,
      envKeys: ['ALLOWED_ENV'],
      defaultTimeoutMs: 5000,
      maxTimeoutMs: 5000,
    };
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('runs a locally configured policy with adapter args and preserves stdout/stderr', async () => {
    const result = await executePolicyCommand({
      executionPolicyKey: 'node',
      executionPolicies: {
        node: policy,
      },
      args: [
        '-e',
        [
          'console.log("hello token=STDOUT_TOKEN_SECRET");',
          'console.error("error password=STDERR_PASSWORD_SECRET");',
        ].join(''),
      ],
      cwd: workspace,
    });

    expect(result.status).toBe('succeeded');
    expect(result.stdout.text).toContain('hello token=STDOUT_TOKEN_SECRET');
    expect(result.stderr.text).toContain('error password=STDERR_PASSWORD_SECRET');

    await expect(
      executePolicyCommand({
        executionPolicyKey: 'not-allowed',
        executionPolicies: {
          node: policy,
        },
        args: ['-e', 'console.log("blocked")'],
        cwd: workspace,
      }),
    ).rejects.toThrow(/not configured/);
  });

  it('rejects cwd outside the policy workspace and only reads declared local env keys', async () => {
    await expect(
      executeCommand({
        policy,
        args: ['-e', 'console.log("outside")'],
        cwd: tempDir,
      }),
    ).rejects.toThrow(/cwd must stay inside/);

    process.env.ALLOWED_ENV = 'safe';
    process.env.SECRET_ENV = 'secret';
    const prepared = await prepareCommandExecution({
      policy,
      args: ['-e', 'console.log("env")'],
      cwd: workspace,
    });
    expect(prepared.env.ALLOWED_ENV).toBe('safe');
    expect(prepared.env.SECRET_ENV).toBeUndefined();
    delete process.env.ALLOWED_ENV;
    delete process.env.SECRET_ENV;
  });

  it('rejects a cwd symlink that escapes the policy workspace', async () => {
    const outside = path.join(tempDir, 'outside');
    const escapedLink = path.join(workspace, 'escaped');
    await fs.mkdir(outside);
    await fs.symlink(outside, escapedLink);

    await expect(
      executeCommand({
        policy,
        args: ['-e', 'console.log("outside")'],
        cwd: escapedLink,
      }),
    ).rejects.toThrow(/cwd must stay inside/);
  });

  it('validates local optional values and caps requested timeouts', async () => {
    const configuredPolicy: ExecutionPolicyDefinition = {
      ...policy,
      allowedOptions: {
        retries: {
          flag: '--retries',
          type: 'integer',
          min: 1,
          max: 3,
        },
      },
      options: {
        retries: 2,
      },
    };
    const prepared = await prepareCommandExecution({
      policy: configuredPolicy,
      cwd: workspace,
    });
    expect(prepared.args).toEqual(['--retries', '2']);

    await expect(
      prepareCommandExecution({
        policy: configuredPolicy,
        cwd: workspace,
        timeoutMs: configuredPolicy.maxTimeoutMs + 1,
      }),
    ).rejects.toThrow(/exceeds execution policy maximum/);
    await expect(
      prepareCommandExecution({
        policy: {
          ...configuredPolicy,
          options: {
            retries: 4,
          },
        },
        cwd: workspace,
      }),
    ).rejects.toThrow(/outside its allowed range/);
  });

  it('prepends the cwd node_modules bin directory to PATH', async () => {
    const localBin = path.join(workspace, 'node_modules', '.bin');
    await fs.mkdir(localBin, { recursive: true });
    const localTool = path.join(localBin, 'ag-local-tool');
    await fs.writeFile(localTool, '#!/bin/sh\nprintf "AG_LOCAL_TOOL_OK:%s" "$PATH"\n', { mode: 0o755 });

    const result = await executeCommand({
      policy: {
        executionPolicyKey: 'ag-local-tool',
        provider: 'generic-cli',
        executable: 'ag-local-tool',
        workspaceRoot: workspace,
        envKeys: [],
        defaultTimeoutMs: 5000,
        maxTimeoutMs: 5000,
      },
      cwd: workspace,
    });

    expect(result.status).toBe('succeeded');
    expect(result.stdout.text).toContain('AG_LOCAL_TOOL_OK');
    expect(result.stdout.text).toContain(localBin);
  });

  it('stops the process on cancel, timeout, and lease lost', async () => {
    const cancelController = new AbortController();
    setTimeout(() => cancelController.abort(), 50);
    const canceled = await executeCommand({
      policy,
      args: ['-e', 'setInterval(() => {}, 1000);'],
      cwd: workspace,

      cancelSignal: cancelController.signal,
    });
    expect(canceled.status).toBe('canceled');

    const timeout = await executeCommand({
      policy,
      args: ['-e', 'process.on("SIGTERM", () => {}); setInterval(() => {}, 1000);'],
      cwd: workspace,

      timeoutMs: 50,
    });
    expect(timeout.status).toBe('timeout');

    const leaseLostController = new AbortController();
    setTimeout(() => leaseLostController.abort(), 50);
    const leaseLost = await executeCommand({
      policy,
      args: ['-e', 'setInterval(() => {}, 1000);'],
      cwd: workspace,

      leaseLostSignal: leaseLostController.signal,
    });
    expect(leaseLost.status).toBe('lease_lost');
  });

  it('cleans up timeout handling when spawn fails before process close', async () => {
    const startedAt = Date.now();
    await expect(
      executeCommand({
        policy: {
          ...policy,
          executable: path.join(workspace, 'missing-node-binary'),
        },
        args: ['-e', 'console.log("missing")'],
        cwd: workspace,

        timeoutMs: 5000,
      }),
    ).rejects.toThrow();
    expect(Date.now() - startedAt).toBeLessThan(2000);
  });

  it('stops subprocesses when a command times out', async () => {
    const markerPath = path.join(tempDir, 'child-survived.txt');
    const script = [
      'const { spawn } = require("child_process");',
      `spawn(process.execPath, ["-e", ${JSON.stringify(
        [
          'process.on("SIGTERM", () => {});',
          `setTimeout(() => require("fs").writeFileSync(${JSON.stringify(markerPath)}, "survived"), 3000);`,
          'setInterval(() => {}, 1000);',
        ].join(''),
      )}], { stdio: "ignore" });`,
      'process.on("SIGTERM", () => {});',
      'setInterval(() => {}, 1000);',
    ].join('');
    const timeout = await executeCommand({
      policy,
      args: ['-e', script],
      cwd: workspace,

      timeoutMs: 50,
    });
    expect(timeout.status).toBe('timeout');

    await new Promise((resolve) => setTimeout(resolve, 3500));
    await expect(fs.access(markerPath)).rejects.toThrow();
  });

  it('stores large stdout/stderr as artifact files instead of inline event-sized text', async () => {
    const artifactDir = path.join(tempDir, 'artifacts');
    const logSize = 16 * 1024;
    const result = await executeCommand({
      policy,
      args: [
        '-e',
        [`process.stdout.write("x".repeat(${logSize}));`, `process.stderr.write("y".repeat(${logSize}));`].join(''),
      ],
      cwd: workspace,

      artifactDir,
      maxInlineLogBytes: 64,
    });

    expect(result.status).toBe('succeeded');
    expect(result.stdout.text).toBeNull();
    expect(result.stderr.text).toBeNull();
    expect(result.stdout.artifactPath).toBe(path.join(artifactDir, 'node-stdout.log'));
    expect(result.stderr.artifactPath).toBe(path.join(artifactDir, 'node-stderr.log'));
    expect(await fs.readFile(String(result.stdout.artifactPath), 'utf8')).toHaveLength(logSize);
    expect(await fs.readFile(String(result.stderr.artifactPath), 'utf8')).toHaveLength(logSize);
  });

  it('preserves UTF-8 sequences split across process output chunks', async () => {
    const artifactDir = path.join(tempDir, 'artifacts');
    const script = [
      'const value = Buffer.from("\u4f60");',
      'process.stdout.write(value.subarray(0, 1));',
      'setTimeout(() => process.stdout.end(value.subarray(1)), 20);',
    ].join('');

    const inlineResult = await executeCommand({
      policy,
      args: ['-e', script],
      cwd: workspace,
    });
    expect(inlineResult.stdout).toMatchObject({
      text: '\u4f60',
      sizeBytes: 3,
    });

    const artifactResult = await executeCommand({
      policy,
      args: ['-e', script],
      cwd: workspace,

      artifactDir,
      maxInlineLogBytes: 1,
    });
    expect(artifactResult.stdout.text).toBeNull();
    expect(await fs.readFile(String(artifactResult.stdout.artifactPath))).toEqual(Buffer.from('\u4f60'));
  });

  it('caps the combined output spool and records truncation', async () => {
    const artifactDir = path.join(tempDir, 'artifacts');
    const result = await executeCommand({
      policy,
      args: ['-e', 'process.stdout.write("x".repeat(4096));'],
      cwd: workspace,

      artifactDir,
      maxInlineLogBytes: 1,
      maxOutputSpoolBytes: 1024,
    });

    expect(result.status).toBe('succeeded');
    expect(result.stdout).toMatchObject({
      sizeBytes: 4096,
      capturedBytes: 1024,
      truncated: true,
    });
    expect((await fs.stat(String(result.stdout.artifactPath))).size).toBe(1024);
  });

  it('terminates the child and rejects promptly when the output spool write fails', async () => {
    const hasDevFull = await fs
      .access('/dev/full')
      .then(() => true)
      .catch(() => false);
    if (!hasDevFull) {
      return;
    }
    const artifactDir = path.join(tempDir, 'artifacts');
    const markerPath = path.join(tempDir, 'write-error-child-survived.txt');
    await fs.mkdir(artifactDir, { recursive: true });
    const stdoutPath = path.join(artifactDir, 'node-stdout.log');
    await fs.symlink('/dev/full', stdoutPath);
    const startedAt = Date.now();

    await expect(
      executeCommand({
        policy,
        args: [
          '-e',
          [
            'setInterval(() => process.stdout.write("x".repeat(4096)), 1);',
            `setTimeout(() => require("fs").writeFileSync(${JSON.stringify(markerPath)}, "survived"), 500);`,
          ].join(''),
        ],
        cwd: workspace,

        artifactDir,
        maxInlineLogBytes: 1,
      }),
    ).rejects.toThrow();

    expect(Date.now() - startedAt).toBeLessThan(2000);
    await new Promise((resolve) => setTimeout(resolve, 700));
    await expect(fs.access(markerPath)).rejects.toThrow();
    await expect(fs.access(stdoutPath)).rejects.toThrow();
  });
});
