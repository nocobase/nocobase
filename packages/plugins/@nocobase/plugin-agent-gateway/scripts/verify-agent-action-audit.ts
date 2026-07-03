/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  AdminScriptArgs,
  JsonRecord,
  getListItems,
  getString,
  parseAdminArgs,
  parseAdminFlags,
  requestJson,
  signIn,
} from './terminal-stream-smoke-script-utils';

interface VerifyAuditArgs extends AdminScriptArgs {
  runId: string;
  sessionId: string;
  action: string;
  operatorEmail: string;
  expectStatuses: string[];
  expectFinalStatuses: string[];
  expectNoControlRequest: boolean;
}

const SUPPORTED_ACTIONS = new Set([
  'dispatch',
  'resume',
  'message',
  'interrupt',
  'terminate',
  'rawTerminalWriteDenied',
  'readTerminal',
  'readRunDetails',
  'readArtifacts',
  'readRawLogs',
  'readSessionMessages',
]);
const SENSITIVE_PATTERNS = [/ag_(?:node|claim|inv|stream)_[A-Za-z0-9._~+/-]+=*/i, /SECRET/i, /TOKEN/i];
const SESSION_SCOPED_ACTIONS = new Set(['resume', 'message', 'rawTerminalWriteDenied']);

function splitCsv(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseArgs(argv: string[]): VerifyAuditArgs {
  const adminArgs = parseAdminArgs(argv);
  const { flags, booleanFlags } = parseAdminFlags(argv);
  const runId = getString(flags['run-id']);
  const sessionId = getString(flags['session-id']);
  const action = getString(flags.action);
  const operatorEmail = getString(flags['operator-email']);
  const expectStatuses = splitCsv(getString(flags['expect-status']));
  const expectFinalStatuses = splitCsv(getString(flags['expect-final-status']));
  if (!action) {
    throw new Error('--action is required');
  }
  if (!SUPPORTED_ACTIONS.has(action)) {
    throw new Error(`Unsupported --action: ${action}`);
  }
  if (!runId && !sessionId && action !== 'dispatch') {
    throw new Error('--run-id or --session-id is required');
  }
  if (!expectStatuses.length && !expectFinalStatuses.length) {
    throw new Error('--expect-status or --expect-final-status is required');
  }
  return {
    ...adminArgs,
    runId,
    sessionId,
    action,
    operatorEmail,
    expectStatuses,
    expectFinalStatuses,
    expectNoControlRequest: booleanFlags.has('expect-no-control-request'),
  };
}

async function listCollection(baseUrl: string, token: string, collection: string, filter: JsonRecord) {
  const search = new URLSearchParams();
  search.set('filter', JSON.stringify(filter));
  const data = await requestJson<unknown>(baseUrl, `/api/${collection}:list?${search.toString()}`, {
    token,
  });
  return getListItems(data);
}

function assertNoSensitiveContent(records: JsonRecord[], label: string) {
  const serialized = JSON.stringify(records);
  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(serialized)) {
      throw new Error(`${label} contains unredacted sensitive content matching ${String(pattern)}`);
    }
  }
}

function assertStatuses(records: JsonRecord[], statuses: string[], label: string) {
  for (const status of statuses) {
    const count = records.filter((record) => getString(record.resultStatus) === status).length;
    if (count === 0) {
      throw new Error(`${label} is missing expected audit status: ${status}`);
    }
    if (status !== 'denied' && count > 1) {
      throw new Error(`${label} has duplicate audit status ${status}: ${count}`);
    }
  }
}

async function findOperatorId(baseUrl: string, token: string, operatorEmail: string) {
  if (!operatorEmail) {
    return '';
  }
  const users = await listCollection(baseUrl, token, 'users', {
    email: operatorEmail,
  });
  const operatorId = getString(users[0]?.id);
  if (!operatorId) {
    throw new Error(`Operator user not found: ${operatorEmail}`);
  }
  return operatorId;
}

async function main() {
  const args = parseArgs(process.argv);
  const token = await signIn(args);
  const operatorId = await findOperatorId(args.baseUrl, token, args.operatorEmail);
  const auditFilter: JsonRecord = {
    action: args.action,
    ...(args.runId ? { runId: args.runId } : {}),
    ...(args.sessionId && SESSION_SCOPED_ACTIONS.has(args.action) ? { sessionId: args.sessionId } : {}),
    ...(operatorId ? { operatorId } : {}),
  };
  const audits = await listCollection(args.baseUrl, token, 'agAgentActionAudits', auditFilter);
  assertStatuses(audits, args.expectStatuses, 'Audit records');
  if (args.expectFinalStatuses.length) {
    const hasFinal = audits.some((record) => args.expectFinalStatuses.includes(getString(record.resultStatus)));
    if (!hasFinal) {
      throw new Error(`Audit records are missing all expected final statuses: ${args.expectFinalStatuses.join(',')}`);
    }
  }
  assertNoSensitiveContent(audits, 'Audit records');

  let controlRequests: JsonRecord[] = [];
  if (args.runId && (args.action === 'interrupt' || args.action === 'terminate')) {
    controlRequests = await listCollection(args.baseUrl, token, 'agRunControlRequests', {
      runId: args.runId,
      action: args.action,
    });
    assertNoSensitiveContent(controlRequests, 'Control requests');
    if (args.expectNoControlRequest && controlRequests.length) {
      throw new Error(`Expected no control request, found ${controlRequests.length}`);
    }
    if (!args.expectNoControlRequest && !controlRequests.length) {
      throw new Error('Expected at least one control request');
    }
  }

  process.stdout.write(
    `${JSON.stringify(
      {
        ok: true,
        auditCount: audits.length,
        controlRequestCount: controlRequests.length,
        operatorEmail: args.operatorEmail || null,
        operatorId: operatorId || null,
        statuses: audits.map((record) => getString(record.resultStatus)),
      },
      null,
      2,
    )}\n`,
  );
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
