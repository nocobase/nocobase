/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { readFile, writeFile } from 'fs/promises';
import { dirname, join, resolve } from 'path';

import {
  JsonRecord,
  getListItems,
  getString,
  isRecord,
  parseAdminFlags,
  requestJson,
  signIn,
} from './terminal-stream-smoke-script-utils';

interface CollectArgs {
  baseUrl: string;
  seedOutput: string;
  flow: string;
  evidenceDir: string;
  output: string;
  adminEmail: string;
  adminPassword: string;
  controlClaims?: string;
  screenshotPath?: string;
  waitMs: number;
}

const DEFAULT_ADMIN_EMAIL = 'admin@nocobase.com';
const DEFAULT_ADMIN_PASSWORD = 'admin123';
const BUSINESS_TRIGGER_SUBDIR = 'business-trigger';

function parseArgs(argv: string[]): CollectArgs {
  const { flags } = parseAdminFlags(argv);
  const baseUrl = getString(flags['base-url']).replace(/\/$/, '');
  const seedOutput = getString(flags['seed-output']);
  const flow = getString(flags.flow);
  const evidenceDir = getString(flags['evidence-dir']);
  const output = getString(flags.output);
  if (!baseUrl || !seedOutput || !flow || !evidenceDir || !output) {
    throw new Error('--base-url, --seed-output, --flow, --evidence-dir, and --output are required');
  }
  return {
    baseUrl,
    seedOutput: resolve(seedOutput),
    flow,
    evidenceDir: resolve(evidenceDir),
    output: resolve(output),
    adminEmail: getString(flags['admin-email']) || DEFAULT_ADMIN_EMAIL,
    adminPassword: getString(flags['admin-password']) || DEFAULT_ADMIN_PASSWORD,
    controlClaims: getString(flags['control-claims']) ? resolve(getString(flags['control-claims'])) : undefined,
    screenshotPath: getString(flags['screenshot-path']),
    waitMs: Number(getString(flags['wait-ms']) || 15000),
  };
}

async function readJson(path: string) {
  const parsed = JSON.parse(await readFile(path, 'utf8')) as unknown;
  if (!isRecord(parsed)) {
    throw new Error(`${path} did not contain a JSON object`);
  }
  return parsed;
}

async function readBusinessSeed(seedOutput: string) {
  const seed = await readJson(seedOutput);
  const nestedPath = join(dirname(seedOutput), BUSINESS_TRIGGER_SUBDIR, 'seed.json');
  try {
    const nestedSeed = await readJson(nestedPath);
    return {
      seed,
      businessSeed: nestedSeed,
    };
  } catch {
    return {
      seed,
      businessSeed: seed,
    };
  }
}

async function listCollection(baseUrl: string, token: string, collection: string, query: JsonRecord) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    search.set(key, typeof value === 'string' ? value : JSON.stringify(value));
  }
  const data = await requestJson<unknown>(baseUrl, `/api/${collection}:list?${search.toString()}`, {
    token,
  });
  return getListItems(data);
}

function getRunIdFromBusinessRecord(record: JsonRecord, relationField: string) {
  const foreignKey = `${relationField}Id`;
  const directId = getString(record[foreignKey]);
  if (directId) {
    return directId;
  }
  const relationValue = record[relationField];
  if (isRecord(relationValue)) {
    return getString(relationValue.id);
  }
  return getString(relationValue);
}

function sortNewestFirst(records: JsonRecord[]) {
  return [...records].sort((left, right) => {
    const leftUpdated = Date.parse(getString(left.updatedAt) || getString(left.createdAt));
    const rightUpdated = Date.parse(getString(right.updatedAt) || getString(right.createdAt));
    if (Number.isFinite(leftUpdated) && Number.isFinite(rightUpdated) && leftUpdated !== rightUpdated) {
      return rightUpdated - leftUpdated;
    }
    return Number(getString(right.id) || 0) - Number(getString(left.id) || 0);
  });
}

async function findBrowserDispatchRecord(args: CollectArgs, token: string, businessSeed: JsonRecord) {
  const collectionName = getString(businessSeed.collectionName);
  const relationField = getString(businessSeed.relationField) || 'agentRun';
  if (!collectionName) {
    throw new Error('Business seed does not include collectionName');
  }
  const seedRecordId = getString(businessSeed.recordId);
  if (seedRecordId) {
    const startedAt = Date.now();
    let latestRecord: JsonRecord | null = null;
    while (Date.now() - startedAt <= args.waitMs) {
      latestRecord = await requestJson<JsonRecord>(
        args.baseUrl,
        `/api/${collectionName}:get/${encodeURIComponent(seedRecordId)}?appends[]=${encodeURIComponent(relationField)}`,
        {
          token,
        },
      );
      const runId = getRunIdFromBusinessRecord(latestRecord, relationField);
      if (runId) {
        return {
          collectionName,
          relationField,
          record: latestRecord,
          runId,
        };
      }
      await sleep(500);
    }
    throw new Error(
      `Seed business record ${collectionName}:${seedRecordId} did not receive a ${relationField} relation within ${
        args.waitMs
      }ms. Last record: ${JSON.stringify(latestRecord)}`,
    );
  }
  const records = await listCollection(args.baseUrl, token, collectionName, {
    pageSize: '200',
  });
  const candidates = sortNewestFirst(records).filter((record) => {
    const runId = getRunIdFromBusinessRecord(record, relationField);
    const scenarioId = getString(record.scenarioId);
    return Boolean(runId) && !scenarioId.startsWith('agw-task-02-');
  });
  if (candidates.length === 0) {
    throw new Error(`No browser-created dispatch record with a relation value found in ${collectionName}`);
  }
  const record = candidates[0];
  return {
    collectionName,
    relationField,
    record,
    runId: getRunIdFromBusinessRecord(record, relationField),
  };
}

async function getRun(baseUrl: string, token: string, runId: string) {
  const run = await requestJson<JsonRecord>(baseUrl, `/api/agRuns:get/${encodeURIComponent(runId)}`, {
    token,
  });
  if (!getString(run.id)) {
    throw new Error(`Run ${runId} was not found`);
  }
  return run;
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function getControlAction(flow: string): 'interrupt' | 'terminate' | null {
  return flow === 'interrupt' || flow === 'terminate' ? flow : null;
}

function getRunDetailUrl(baseUrl: string, runId: string) {
  return `${baseUrl}/admin/settings/agent-gateway/runs?runId=${encodeURIComponent(runId)}`;
}

function getNumber(value: unknown) {
  const numberValue = typeof value === 'number' ? value : Number(value);
  return Number.isInteger(numberValue) ? numberValue : null;
}

function getRequiredString(record: JsonRecord, key: string) {
  const value = getString(record[key]);
  if (!value) {
    throw new Error(`Control claim is missing ${key}`);
  }
  return value;
}

function getRequiredNumber(record: JsonRecord, key: string) {
  const value = getNumber(record[key]);
  if (value === null) {
    throw new Error(`Control claim is missing numeric ${key}`);
  }
  return value;
}

async function readControlClaim(path: string, action: 'interrupt' | 'terminate') {
  const claims = await readJson(path);
  const flows = isRecord(claims.flows) ? claims.flows : {};
  const claim = flows[action];
  if (!isRecord(claim)) {
    throw new Error(`Control claims file does not include ${action}`);
  }
  return {
    runId: getRequiredString(claim, 'runId'),
    nodeId: getRequiredString(claim, 'nodeId'),
    nodeToken: getRequiredString(claim, 'nodeToken'),
    claimToken: getRequiredString(claim, 'claimToken'),
    claimAttempt: getRequiredNumber(claim, 'claimAttempt'),
    leaseVersion: getRequiredNumber(claim, 'leaseVersion'),
    sessionName: getString(claim.sessionName),
  };
}

async function findLatestControlRequest(
  baseUrl: string,
  token: string,
  runId: string,
  action: 'interrupt' | 'terminate',
) {
  const requests = await listCollection(baseUrl, token, 'agRunControlRequests', {
    filter: {
      runId,
    },
    pageSize: '20',
  });
  return (
    sortNewestFirst(requests)
      .filter((request) => getString(request.action) === action)
      .find((request) => getString(request.id)) || null
  );
}

async function waitForControlRequest(
  args: CollectArgs,
  token: string,
  runId: string,
  action: 'interrupt' | 'terminate',
) {
  const startedAt = Date.now();
  while (Date.now() - startedAt <= args.waitMs) {
    const request = await findLatestControlRequest(args.baseUrl, token, runId, action);
    if (request) {
      return request;
    }
    await sleep(500);
  }
  throw new Error(`Timed out waiting for browser-created ${action} control request for run ${runId}`);
}

async function postNodeControlRequest(
  args: CollectArgs,
  claim: Awaited<ReturnType<typeof readControlClaim>>,
  path: string,
  body: JsonRecord,
) {
  return await requestJson<JsonRecord>(args.baseUrl, path, {
    method: 'POST',
    nodeToken: claim.nodeToken,
    body: {
      claimToken: claim.claimToken,
      claimAttempt: claim.claimAttempt,
      leaseVersion: claim.leaseVersion,
      ...body,
    },
  });
}

async function collectControlFlow(
  args: CollectArgs,
  token: string,
  seed: JsonRecord,
  action: 'interrupt' | 'terminate',
) {
  if (!args.controlClaims) {
    throw new Error('--control-claims is required for interrupt and terminate flows');
  }
  const claim = await readControlClaim(args.controlClaims, action);
  const controlRequest = await waitForControlRequest(args, token, claim.runId, action);
  const controlRequestId = getString(controlRequest.id);
  const pending = await postNodeControlRequest(
    args,
    claim,
    `/api/agent-gateway/nodes/${encodeURIComponent(claim.nodeId)}/runs/${encodeURIComponent(
      claim.runId,
    )}/control-requests:pending`,
    {},
  );
  const delivered = await postNodeControlRequest(
    args,
    claim,
    `/api/agent-gateway/nodes/${encodeURIComponent(claim.nodeId)}/runs/${encodeURIComponent(
      claim.runId,
    )}/control-requests/${encodeURIComponent(controlRequestId)}:ack`,
    {
      status: 'delivered',
      metadataJson: {
        source: 'final-browser-control-helper',
        action,
      },
    },
  );
  const succeeded = await postNodeControlRequest(
    args,
    claim,
    `/api/agent-gateway/nodes/${encodeURIComponent(claim.nodeId)}/runs/${encodeURIComponent(
      claim.runId,
    )}/control-requests/${encodeURIComponent(controlRequestId)}:ack`,
    {
      status: 'succeeded',
      metadataJson: {
        source: 'final-browser-control-helper',
        action,
      },
    },
  );
  const cancelAck =
    action === 'terminate'
      ? await postNodeControlRequest(
          args,
          claim,
          `/api/agent-gateway/nodes/${encodeURIComponent(claim.nodeId)}/runs/${encodeURIComponent(
            claim.runId,
          )}/cancel-ack`,
          {},
        )
      : null;
  const run = await getRun(args.baseUrl, token, claim.runId);
  const runStatus = getString(run.status);
  const expectedRunStatuses = action === 'terminate' ? ['canceled'] : ['claimed', 'running', 'succeeded'];
  return {
    flow: action,
    source: 'agent-browser+node-control-helper',
    observedAt: new Date().toISOString(),
    url: getRunDetailUrl(args.baseUrl, claim.runId),
    result: {
      runId: claim.runId,
      controlRequestId,
      pendingRequestsCount: Array.isArray(pending.requests) ? pending.requests.length : 0,
      deliveredStatus: getString(delivered.status),
      finalState: getString(succeeded.status),
      cancelAckStatus: getString(cancelAck?.status),
      runStatus,
      expectedRunStatuses,
      sessionName: claim.sessionName || undefined,
      screenshotPath: args.screenshotPath || undefined,
    },
  };
}

async function main() {
  const args = parseArgs(process.argv);
  const { seed, businessSeed } = await readBusinessSeed(args.seedOutput);
  const token = await signIn(args);
  const controlAction = getControlAction(args.flow);
  if (controlAction) {
    const result = await collectControlFlow(args, token, seed, controlAction);
    await writeFile(args.output, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }
  if (!['final-business-dispatch', 'xterm-business-dispatch', 'business-dispatch-daemon-stream'].includes(args.flow)) {
    throw new Error(`Unsupported browser action result flow: ${args.flow}`);
  }
  const dispatch = await findBrowserDispatchRecord(args, token, businessSeed);
  const run = await getRun(args.baseUrl, token, dispatch.runId);
  const runCode = getString(run.runCode);
  const result = {
    flow: args.flow,
    source: 'agent-browser',
    observedAt: new Date().toISOString(),
    url: getString(seed.businessPageUrl) || getString(businessSeed.businessPageUrl),
    result: {
      businessRecordId: getString(dispatch.record.id),
      runId: dispatch.runId,
      runCode,
      relationField: dispatch.relationField,
      runDetailUrl: `${args.baseUrl}/admin/settings/agent-gateway/runs?runId=${encodeURIComponent(dispatch.runId)}`,
      vRunDetailUrl: `${args.baseUrl}/v/admin/settings/agent-gateway/runs?runId=${encodeURIComponent(dispatch.runId)}`,
      sourceCollection: dispatch.collectionName,
      sourceScenarioId: getString(dispatch.record.scenarioId),
    },
  };
  await writeFile(args.output, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack || error.message : String(error)}\n`);
  process.exitCode = 1;
});
