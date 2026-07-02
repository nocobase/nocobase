/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { JsonRecord, getString, parseAdminFlags, requestJson, signIn } from './terminal-stream-smoke-script-utils';

interface CleanupArgs {
  serverUrl: string;
  runId: string;
  expectedActiveSubscriptions: number;
  expectedPendingSnapshotRequests: number;
  adminEmail?: string;
  adminPassword?: string;
  sessionToken?: string;
  timeoutMs: number;
}

function parseInteger(value: string, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

function parseArgs(argv: string[]): CleanupArgs {
  const { flags } = parseAdminFlags(argv);
  const serverUrl = getString(flags['server-url'] || flags['base-url']).replace(/\/$/, '');
  const runId = getString(flags['run-id']);
  if (!serverUrl || !runId) {
    throw new Error('--server-url and --run-id are required');
  }
  return {
    serverUrl,
    runId,
    expectedActiveSubscriptions: parseInteger(getString(flags['expected-active-subscriptions']), 0),
    expectedPendingSnapshotRequests: parseInteger(getString(flags['expected-pending-snapshot-requests']), 0),
    adminEmail: getString(flags['admin-email']) || undefined,
    adminPassword: getString(flags['admin-password']) || undefined,
    sessionToken: getString(flags['session-token']) || undefined,
    timeoutMs: parseInteger(getString(flags['timeout-ms']), 10_000),
  };
}

async function getToken(args: CleanupArgs) {
  if (args.sessionToken) {
    return args.sessionToken;
  }
  if (!args.adminEmail || !args.adminPassword) {
    throw new Error('--admin-email/--admin-password or --session-token is required');
  }
  return await signIn({
    baseUrl: args.serverUrl,
    adminEmail: args.adminEmail,
    adminPassword: args.adminPassword,
  });
}

async function readStats(args: CleanupArgs, token: string) {
  const search = new URLSearchParams();
  search.set('runId', args.runId);
  return await requestJson<JsonRecord>(args.serverUrl, `/api/agent-gateway/terminal-stream:stats?${search}`, {
    token,
  });
}

async function main() {
  const args = parseArgs(process.argv);
  const token = await getToken(args);
  const startedAt = Date.now();
  let latest: JsonRecord = {};
  while (Date.now() - startedAt <= args.timeoutMs) {
    latest = await readStats(args, token);
    const active = Number(latest.activeBrowserSubscriptionsForRun ?? latest.activeBrowserSubscriptions ?? 0);
    const pendingSnapshotRequests = Number(latest.pendingSnapshotRequests ?? 0);
    if (
      active === args.expectedActiveSubscriptions &&
      pendingSnapshotRequests === args.expectedPendingSnapshotRequests
    ) {
      process.stdout.write(
        `${JSON.stringify(
          {
            runId: args.runId,
            expectedActiveSubscriptions: args.expectedActiveSubscriptions,
            expectedPendingSnapshotRequests: args.expectedPendingSnapshotRequests,
            activeBrowserSubscriptionsForRun: active,
            pendingSnapshotRequests,
            stats: latest,
            passed: true,
          },
          null,
          2,
        )}\n`,
      );
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  const active = Number(latest.activeBrowserSubscriptionsForRun ?? latest.activeBrowserSubscriptions ?? 0);
  const pendingSnapshotRequests = Number(latest.pendingSnapshotRequests ?? 0);
  process.stdout.write(
    `${JSON.stringify(
      {
        runId: args.runId,
        expectedActiveSubscriptions: args.expectedActiveSubscriptions,
        expectedPendingSnapshotRequests: args.expectedPendingSnapshotRequests,
        activeBrowserSubscriptionsForRun: active,
        pendingSnapshotRequests,
        stats: latest,
        passed: false,
      },
      null,
      2,
    )}\n`,
  );
  throw new Error(
    `Expected ${args.expectedActiveSubscriptions} active subscriptions and ${args.expectedPendingSnapshotRequests} pending snapshot requests, found ${active} active subscriptions and ${pendingSnapshotRequests} pending snapshot requests`,
  );
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
