/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createHash, randomUUID } from 'crypto';

import { Context, Next } from '@nocobase/actions';
import { Plugin } from '@nocobase/server';
import { UniqueConstraintError } from 'sequelize';
import type { Transaction } from 'sequelize';

import { captureTmuxSession, isManagedTmuxSessionName } from '../../daemon/tmuxTerminal';
import {
  AGENT_GATEWAY_ACTIONS,
  AGENT_GATEWAY_PERMISSIONS,
  redactEventPayload,
  redactObservabilityText,
} from '../security';
import { auditAgentActionBestEffort, auditReadAgentAction } from '../audit/agentActionAudit';
import {
  API_PREFIX,
  JsonRecord,
  ModelRecord,
  assertRunVisible,
  getBodyValues,
  getCurrentUserId,
  getDate,
  getModelJson,
  getModelNumber,
  getModelString,
  getModelTargetKey,
  getModelValue,
  getRecord,
  getString,
  requireAgentGatewayPermission,
  requireLoggedIn,
} from './utils';
import { cancelRun, validateRunLease } from './runLifecycle';

const MAX_TERMINAL_INPUT_CHARS = 4000;
const DEFAULT_CAPTURE_LINES = 2000;
const MAX_CAPTURE_LINES = 5000;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TERMINAL_BACKENDS = new Set(['tmux']);
const TERMINAL_STATUSES = new Set(['active', 'closed', 'unavailable']);
const TERMINAL_CONTROL_RUN_STATUSES = new Set(['claimed', 'syncing_skills', 'running']);
const CONTROL_REQUEST_STATUSES = new Set(['accepted', 'delivered', 'succeeded', 'failed']);
const MAX_CONTROL_REASON_CHARS = 1000;
const MAX_CONTROL_IDEMPOTENCY_KEY_CHARS = 200;
const CONTROL_ERROR_CODES = {
  unsupported: 'CONTROL_UNSUPPORTED',
  runNotActive: 'CONTROL_RUN_NOT_ACTIVE',
  requestAccepted: 'CONTROL_REQUEST_ACCEPTED',
  rawWriteDisabled: 'TERMINAL_RAW_WRITE_DISABLED',
} as const;

function getBoolean(value: unknown) {
  return value === true;
}

function getCaptureLines(ctx: Context) {
  const rawValue = getRecord(ctx.query).lines;
  const numberValue = typeof rawValue === 'number' ? rawValue : Number(rawValue);
  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    return DEFAULT_CAPTURE_LINES;
  }
  return Math.min(numberValue, MAX_CAPTURE_LINES);
}

function getOptionalInteger(ctx: Context, value: unknown, name: string) {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const numberValue = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(numberValue)) {
    ctx.throw(400, `${name} must be an integer`);
  }
  return numberValue;
}

function assertRunId(ctx: Context, runId: string) {
  if (!UUID_PATTERN.test(runId)) {
    ctx.throw(400, 'runId must be a valid UUID');
  }
}

function serializeRun(run: ModelRecord) {
  const json = getModelJson(run);
  delete json.claimTokenHash;
  delete json.promptSnapshot;
  delete json.executionPayloadJson;
  return json;
}

async function requireTerminalRead(ctx: Context, runId: string) {
  try {
    await requireAgentGatewayPermission(
      ctx,
      AGENT_GATEWAY_ACTIONS.readTerminal,
      'Agent Gateway terminal read permission required',
    );
  } catch (error) {
    await auditAgentActionBestEffort(ctx, {
      action: 'readTerminal',
      runId,
      operatorId: getCurrentUserId(ctx) || undefined,
      permissionKey: AGENT_GATEWAY_PERMISSIONS.readTerminal,
      resultStatus: 'denied',
      metadataJson: {
        routeAction: 'terminal:snapshot',
        phase: 'permission',
      },
    });
    throw error;
  }
}

async function requireTerminalAction(
  ctx: Context,
  action: string,
  message: string,
  deniedAudit?: {
    runId: string;
    permissionKey: string;
    action: 'interrupt' | 'rawTerminalWriteDenied' | 'terminate';
  },
) {
  try {
    await requireAgentGatewayPermission(ctx, action, message);
  } catch (error) {
    if (deniedAudit) {
      await auditAgentActionBestEffort(ctx, {
        action: deniedAudit.action,
        runId: deniedAudit.runId,
        operatorId: getCurrentUserId(ctx) || undefined,
        permissionKey: deniedAudit.permissionKey,
        resultStatus: 'denied',
      });
    }
    throw error;
  }
}

async function findRun(ctx: Context, runId: string, transaction?: Transaction) {
  const run = (await ctx.db.getRepository('agRuns').findOne({
    filterByTk: runId,
    transaction,
    ...(transaction ? { lock: transaction.LOCK.UPDATE } : {}),
  })) as ModelRecord | null;
  if (!run) {
    ctx.throw(404, 'Run not found');
  }
  return run;
}

async function findRunVisible(ctx: Context, runId: string) {
  return await assertRunVisible(ctx, runId, 'get');
}

function getTerminalSessionName(ctx: Context, run: ModelRecord) {
  const sessionName = getModelString(run, 'terminalSessionName');
  if (!sessionName) {
    return '';
  }
  if (!isManagedTmuxSessionName(sessionName)) {
    ctx.throw(409, 'Run terminal session is not managed by Agent Gateway');
  }
  return sessionName;
}

function getTerminalSnapshotBody(run: ModelRecord, snapshot: Awaited<ReturnType<typeof captureTmuxSession>> | null) {
  return {
    backend: getModelString(run, 'terminalBackend') || null,
    terminalStatus: getModelString(run, 'terminalStatus') || null,
    runStatus: getModelString(run, 'status'),
    available: Boolean(snapshot?.available),
    output: snapshot?.output || '',
    capturedAt: snapshot?.capturedAt || new Date().toISOString(),
    inputEnabled: false,
  };
}

function getRunAuditFields(ctx: Context, run: ModelRecord) {
  return {
    runId: getModelString(run, 'id'),
    sessionId: getModelString(run, 'agentSessionId') || undefined,
    operatorId: getCurrentUserId(ctx) || undefined,
    provider: getModelString(run, 'agentSessionProvider') || undefined,
  };
}

async function auditTerminalRead(ctx: Context, run: ModelRecord, metadataJson: JsonRecord) {
  await auditReadAgentAction(ctx, {
    action: 'readTerminal',
    ...getRunAuditFields(ctx, run),
    permissionKey: AGENT_GATEWAY_PERMISSIONS.readTerminal,
    resultStatus: 'succeeded',
    metadataJson,
  });
}

async function auditTerminalReadDenied(ctx: Context, runId: string, metadataJson: JsonRecord) {
  await auditAgentActionBestEffort(ctx, {
    action: 'readTerminal',
    runId,
    operatorId: getCurrentUserId(ctx) || undefined,
    permissionKey: AGENT_GATEWAY_PERMISSIONS.readTerminal,
    resultStatus: 'denied',
    metadataJson: {
      routeAction: 'terminal:snapshot',
      ...metadataJson,
    },
  });
}

async function updateTerminalLastActivity(ctx: Context, runId: string, transaction?: Transaction) {
  await ctx.db.getRepository('agRuns').update({
    filterByTk: runId,
    values: {
      terminalLastActivityAt: new Date(),
    },
    transaction,
  });
}

async function appendTerminalControlEvent(
  ctx: Context,
  run: ModelRecord,
  eventType: string,
  payloadJson: JsonRecord,
  transaction?: Transaction,
) {
  const runId = String(getModelTargetKey(run, 'id'));
  const source = 'terminal-control';
  const append = async (eventTransaction: Transaction) => {
    const latestEvent = (await ctx.db.getRepository('agRunEvents').findOne({
      filter: {
        runId,
        source,
      },
      sort: ['-sequence'],
      transaction: eventTransaction,
      lock: eventTransaction.LOCK.UPDATE,
    })) as ModelRecord | null;
    const sequence = (latestEvent ? getModelNumber(latestEvent, 'sequence') : 0) + 1;
    await ctx.db.getRepository('agRunEvents').create({
      values: {
        id: randomUUID(),
        runId,
        claimAttempt: getModelNumber(run, 'claimAttempt'),
        source,
        sequence,
        level: 'info',
        eventType,
        message: eventType,
        payloadJson,
        emittedAt: new Date(),
      },
      transaction: eventTransaction,
    });
  };
  if (transaction) {
    await append(transaction);
    return;
  }
  await ctx.db.sequelize.transaction(append);
}

async function snapshotTerminal(ctx: Context, runId: string) {
  await requireTerminalRead(ctx, runId);
  let run: ModelRecord;
  try {
    run = await findRunVisible(ctx, runId);
  } catch (error) {
    await auditTerminalReadDenied(ctx, runId, {
      phase: 'visibility',
      reason: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
  const sessionName = getTerminalSessionName(ctx, run);
  const lines = getCaptureLines(ctx);
  if (getModelString(run, 'terminalBackend') !== 'tmux' || !sessionName) {
    ctx.body = getTerminalSnapshotBody(run, null);
    await auditTerminalRead(ctx, run, {
      available: false,
      lines,
    });
    return;
  }

  const snapshot = await captureTmuxSession(sessionName, lines);
  ctx.body = getTerminalSnapshotBody(run, snapshot);
  await auditTerminalRead(ctx, run, {
    available: Boolean(snapshot.available),
    lines,
  });
}

function getRawTerminalWriteAuditMetadata(values: JsonRecord, routeAction: 'terminal:send' | 'terminal:write') {
  const input = values.input;
  const inputType = input === null ? 'null' : Array.isArray(input) ? 'array' : typeof input;
  const inputSizeBytes = typeof input === 'string' ? Buffer.byteLength(input) : null;
  const inputTooLarge = typeof input === 'string' ? input.length > MAX_TERMINAL_INPUT_CHARS : false;
  return {
    routeAction,
    appendEnter: values.appendEnter === undefined ? true : getBoolean(values.appendEnter),
    inputPresent: input !== undefined,
    inputType,
    inputSizeBytes,
    inputTooLarge,
  };
}

async function auditRawTerminalWriteDenied(ctx: Context, runId: string, metadataJson: JsonRecord = {}) {
  const run = await assertRunVisible(ctx, runId, 'get').catch(() => null);
  await auditAgentActionBestEffort(ctx, {
    action: 'rawTerminalWriteDenied',
    runId: runId || undefined,
    sessionId: run ? getModelString(run as ModelRecord, 'agentSessionId') || undefined : undefined,
    operatorId: getCurrentUserId(ctx) || undefined,
    permissionKey: AGENT_GATEWAY_PERMISSIONS.writeTerminalRaw,
    resultStatus: 'denied',
    provider: run ? getModelString(run as ModelRecord, 'agentSessionProvider') || undefined : undefined,
    metadataJson: {
      code: 'TERMINAL_RAW_WRITE_DISABLED',
      runVisible: Boolean(run),
      ...metadataJson,
    },
  });
}

async function sendTerminalInput(ctx: Context, runId: string, routeAction: 'terminal:send' | 'terminal:write') {
  await requireLoggedIn(ctx);
  const values = getBodyValues(ctx);
  await auditRawTerminalWriteDenied(ctx, runId, getRawTerminalWriteAuditMetadata(values, routeAction));
  ctx.throw(403, {
    code: CONTROL_ERROR_CODES.rawWriteDisabled,
    message: 'Raw terminal write is disabled',
  });
}

function hashText(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof UniqueConstraintError ||
    getString((error as { name?: unknown } | null)?.name) === 'SequelizeUniqueConstraintError'
  );
}

function getControlReason(ctx: Context, value: unknown) {
  if (value === undefined || value === null) {
    return '';
  }
  if (typeof value !== 'string') {
    ctx.throw(400, 'reason must be a string');
  }
  if (value.length > MAX_CONTROL_REASON_CHARS) {
    ctx.throw(413, 'reason is too large');
  }
  return value;
}

function getRequiredControlIdempotencyKey(ctx: Context, value: unknown) {
  const idempotencyKey = getString(value);
  if (!idempotencyKey) {
    ctx.throw(400, 'idempotencyKey is required');
  }
  if (idempotencyKey.length > MAX_CONTROL_IDEMPOTENCY_KEY_CHARS) {
    ctx.throw(413, 'idempotencyKey is too large');
  }
  return idempotencyKey;
}

function getControlPermissionKey(action: 'interrupt' | 'terminate') {
  return action === 'interrupt' ? AGENT_GATEWAY_PERMISSIONS.interruptRun : AGENT_GATEWAY_PERMISSIONS.terminateRun;
}

function getControlRequestKey(
  action: 'interrupt' | 'terminate',
  runId: string,
  operatorId: string | number,
  key: string,
) {
  return `control:${action}:${runId}:${operatorId}:provided:${hashText(key)}`;
}

function formatControlRequestedAt(request: ModelRecord) {
  const requestedAt = getModelValue(request, 'createdAt');
  return requestedAt instanceof Date ? requestedAt.toISOString() : String(requestedAt || new Date().toISOString());
}

function serializeControlRequest(request: ModelRecord) {
  return {
    id: getModelTargetKey(request, 'id'),
    runId: getModelString(request, 'runId'),
    action: getModelString(request, 'action'),
    reason: getModelString(request, 'reason') || undefined,
    status: getModelString(request, 'status'),
    createdAt: getModelValue(request, 'createdAt'),
  };
}

function serializeControlRequestStatus(request: ModelRecord) {
  return {
    runId: getModelString(request, 'runId'),
    controlRequestId: getModelTargetKey(request, 'id'),
    controlRequestStatus: getModelString(request, 'status') || 'accepted',
    deliveredAt: getModelValue(request, 'deliveredAt') || null,
    completedAt: getModelValue(request, 'completedAt') || null,
  };
}

async function findExistingControlRequestByKey(
  ctx: Context,
  runId: string,
  action: 'interrupt' | 'terminate',
  idempotencyKey: string,
) {
  const operatorId = getCurrentUserId(ctx);
  if (!operatorId) {
    ctx.throw(401, 'Authentication required');
  }
  const requestKey = getControlRequestKey(action, runId, operatorId, idempotencyKey);
  return (await ctx.db.getRepository('agRunControlRequests').findOne({
    filter: {
      requestKey,
    },
  })) as ModelRecord | null;
}

function respondWithExistingControlRequest(
  ctx: Context,
  runId: string,
  runStatus: string,
  action: 'interrupt' | 'terminate',
  request: ModelRecord,
) {
  const responseStatus = action === 'terminate' && runStatus === 'running' ? 'canceling' : runStatus;
  ctx.body = {
    success: true,
    runId,
    status: responseStatus || (action === 'terminate' ? 'canceling' : runStatus),
    ...(action === 'interrupt'
      ? {
          terminalSignal: 'interrupt',
        }
      : {
          terminalTerminationRequested: true,
        }),
    controlRequestId: getModelTargetKey(request, 'id'),
    controlRequestStatus: getModelString(request, 'status') || 'accepted',
    requestedAt: formatControlRequestedAt(request),
  };
}

async function getSessionForRun(ctx: Context, run: ModelRecord) {
  const sessionId = getModelString(run, 'agentSessionId');
  if (!sessionId) {
    return null;
  }
  return (await ctx.db.getRepository('agAgentSessions').findOne({
    filterByTk: sessionId,
  })) as ModelRecord | null;
}

function getControlCapabilityDecision(capabilities: JsonRecord, action: 'interrupt' | 'terminate') {
  if (capabilities[action] === true) {
    return true;
  }
  if (capabilities[action] === false) {
    return false;
  }

  for (const key of ['terminal', 'terminalControl']) {
    const scopedCapabilities = getRecord(capabilities[key]);
    if (scopedCapabilities[action] === true) {
      return true;
    }
    if (scopedCapabilities[action] === false) {
      return false;
    }
  }

  return null;
}

async function getRunnerControlCapability(ctx: Context, run: ModelRecord, action: 'interrupt' | 'terminate') {
  const decisions: Array<boolean | null> = [];
  const nodeId = getModelString(run, 'nodeId');
  if (nodeId) {
    const node = (await ctx.db.getRepository('agNodes').findOne({
      filterByTk: nodeId,
    })) as ModelRecord | null;
    if (node) {
      decisions.push(getControlCapabilityDecision(getRecord(getModelValue(node, 'capabilitiesJson')), action));
    }
  }

  const agentProfileId = getModelString(run, 'agentProfileId');
  if (agentProfileId) {
    const profile = (await ctx.db.getRepository('agAgentProfiles').findOne({
      filterByTk: agentProfileId,
    })) as ModelRecord | null;
    if (profile) {
      decisions.push(getControlCapabilityDecision(getRecord(getModelValue(profile, 'capabilitiesJson')), action));
    }
  }

  if (decisions.includes(false)) {
    return false;
  }
  return decisions.includes(true);
}

async function assertControlSupported(ctx: Context, run: ModelRecord, action: 'interrupt' | 'terminate') {
  const status = getModelString(run, 'status');
  if (!TERMINAL_CONTROL_RUN_STATUSES.has(status)) {
    ctx.throw(409, CONTROL_ERROR_CODES.runNotActive);
  }

  const sessionName = getTerminalSessionName(ctx, run);
  if (getModelString(run, 'terminalBackend') !== 'tmux' || getModelString(run, 'terminalStatus') !== 'active') {
    ctx.throw(409, CONTROL_ERROR_CODES.runNotActive);
  }
  if (!sessionName) {
    ctx.throw(409, CONTROL_ERROR_CODES.runNotActive);
  }

  const session = await getSessionForRun(ctx, run);
  const controlCapability = session
    ? getControlCapabilityDecision(getRecord(getModelValue(session, 'capabilitiesJson')), action) === true
    : await getRunnerControlCapability(ctx, run, action);
  if (!controlCapability) {
    ctx.throw(409, CONTROL_ERROR_CODES.unsupported);
  }
}

async function auditControlDenied(
  ctx: Context,
  run: ModelRecord,
  action: 'interrupt' | 'terminate',
  permissionKey: string,
  metadataJson: JsonRecord = {},
) {
  await auditAgentActionBestEffort(ctx, {
    action,
    ...getRunAuditFields(ctx, run),
    permissionKey,
    resultStatus: 'denied',
    metadataJson,
  });
}

async function createOrFindControlRequest(options: {
  ctx: Context;
  run: ModelRecord;
  action: 'interrupt' | 'terminate';
  reason: string;
  idempotencyKey: string;
  permissionKey: string;
}) {
  const operatorId = getCurrentUserId(options.ctx);
  if (!operatorId) {
    options.ctx.throw(401, 'Authentication required');
  }
  const runId = String(getModelTargetKey(options.run, 'id'));
  const requestKey = getControlRequestKey(options.action, runId, operatorId, options.idempotencyKey);
  try {
    return await options.ctx.db.sequelize.transaction(async (transaction) => {
      const existing = (await options.ctx.db.getRepository('agRunControlRequests').findOne({
        filter: {
          requestKey,
        },
        transaction,
        lock: transaction.LOCK.UPDATE,
      })) as ModelRecord | null;
      if (existing) {
        return {
          request: existing,
          deduped: true,
        };
      }

      const lockedRun = await findRun(options.ctx, runId, transaction);
      await assertControlSupported(options.ctx, lockedRun, options.action);

      const controlRequestId = randomUUID();
      const request = (await options.ctx.db.getRepository('agRunControlRequests').create({
        values: {
          id: controlRequestId,
          runId,
          agentSessionId: getModelString(lockedRun, 'agentSessionId') || null,
          action: options.action,
          reason: options.reason ? redactObservabilityText(options.reason) : null,
          idempotencyKey: options.idempotencyKey,
          requestKey,
          requestedById: operatorId,
          status: 'accepted',
          metadataJson: {
            terminalBackend: getModelString(lockedRun, 'terminalBackend') || null,
          },
        },
        transaction,
      })) as ModelRecord;

      await options.ctx.db.getRepository('agAgentActionAudits').create({
        values: {
          id: randomUUID(),
          action: options.action,
          ...getRunAuditFields(options.ctx, lockedRun),
          permissionKey: options.permissionKey,
          resultStatus: 'accepted',
          metadataJson: {
            controlRequestId,
            idempotent: false,
          },
        },
        transaction,
      });

      if (options.action === 'terminate') {
        await options.ctx.db.getRepository('agRuns').update({
          filterByTk: runId,
          values: {
            cancelRequested: true,
            cancelRequestedAt: getModelValue(lockedRun, 'cancelRequestedAt') || new Date(),
            status: getModelString(lockedRun, 'status') === 'queued' ? 'canceled' : 'canceling',
          },
          transaction,
        });
      }

      return {
        request,
        deduped: false,
      };
    });
  } catch (error) {
    if (!isUniqueConstraintError(error)) {
      throw error;
    }
    const existing = (await options.ctx.db.getRepository('agRunControlRequests').findOne({
      filter: {
        requestKey,
      },
    })) as ModelRecord | null;
    if (!existing) {
      throw error;
    }
    return {
      request: existing,
      deduped: true,
    };
  }
}

async function enqueueTerminalControl(ctx: Context, runId: string, action: 'interrupt' | 'terminate') {
  const permissionAction =
    action === 'interrupt' ? AGENT_GATEWAY_ACTIONS.interruptRun : AGENT_GATEWAY_ACTIONS.terminateRun;
  const permissionKey = getControlPermissionKey(action);
  await requireTerminalAction(
    ctx,
    permissionAction,
    action === 'interrupt'
      ? 'Agent Gateway interrupt permission required'
      : 'Agent Gateway terminate permission required',
    {
      runId,
      permissionKey,
      action,
    },
  );
  let run: ModelRecord;
  try {
    run = await findRunVisible(ctx, runId);
  } catch (error) {
    await auditAgentActionBestEffort(ctx, {
      action,
      runId,
      operatorId: getCurrentUserId(ctx) || undefined,
      permissionKey,
      resultStatus: 'denied',
      metadataJson: {
        phase: 'visibility',
        reason: error instanceof Error ? error.message : String(error),
      },
    });
    throw error;
  }
  const values = getBodyValues(ctx);
  const reason = getControlReason(ctx, values.reason);
  const idempotencyKey = getRequiredControlIdempotencyKey(ctx, values.idempotencyKey);
  const status = getModelString(run, 'status');
  const existingControlRequest = await findExistingControlRequestByKey(ctx, runId, action, idempotencyKey);
  if (existingControlRequest) {
    respondWithExistingControlRequest(ctx, runId, status, action, existingControlRequest);
    return;
  }
  try {
    await assertControlSupported(ctx, run, action);
  } catch (error) {
    await auditControlDenied(ctx, run, action, permissionKey, {
      reason: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }

  const { request } = await createOrFindControlRequest({
    ctx,
    run,
    action,
    reason,
    idempotencyKey,
    permissionKey,
  });
  if (action === 'terminate') {
    await cancelRun(ctx, runId, { requirePermission: false }).catch(() => {
      // The request is already durable; a concurrent terminal transition can make
      // cancellation redundant.
    });
  }

  if (action === 'interrupt') {
    const controlRequestStatus = getModelString(request, 'status') || 'accepted';
    ctx.body = {
      success: true,
      runId,
      status,
      terminalSignal: 'interrupt',
      controlRequestId: getModelTargetKey(request, 'id'),
      controlRequestStatus,
      requestedAt: formatControlRequestedAt(request),
    };
    return;
  }
  const controlRequestStatus = getModelString(request, 'status') || 'accepted';
  ctx.body = {
    success: true,
    runId,
    status: 'canceling',
    terminalTerminationRequested: true,
    controlRequestId: getModelTargetKey(request, 'id'),
    controlRequestStatus,
    requestedAt: formatControlRequestedAt(request),
  };
}

async function interruptTerminal(ctx: Context, runId: string) {
  await enqueueTerminalControl(ctx, runId, 'interrupt');
}

async function terminateTerminal(ctx: Context, runId: string) {
  await enqueueTerminalControl(ctx, runId, 'terminate');
}

async function getControlRequestStatus(ctx: Context, runId: string, requestId: string) {
  const request = (await ctx.db.getRepository('agRunControlRequests').findOne({
    filter: {
      id: requestId,
      runId,
    },
  })) as ModelRecord | null;
  if (!request) {
    ctx.throw(404, 'Control request not found');
  }

  const action = getModelString(request, 'action');
  if (action !== 'interrupt' && action !== 'terminate') {
    ctx.throw(409, 'Unsupported control request action');
  }

  await requireTerminalAction(
    ctx,
    action === 'interrupt' ? AGENT_GATEWAY_ACTIONS.interruptRun : AGENT_GATEWAY_ACTIONS.terminateRun,
    action === 'interrupt'
      ? 'Agent Gateway interrupt permission required'
      : 'Agent Gateway terminate permission required',
    {
      runId,
      permissionKey: getControlPermissionKey(action),
      action,
    },
  );
  await findRunVisible(ctx, runId);

  const operatorId = getCurrentUserId(ctx);
  if (!operatorId || String(getModelValue(request, 'requestedById')) !== String(operatorId)) {
    ctx.throw(404, 'Control request not found');
  }

  ctx.body = serializeControlRequestStatus(request);
}

async function listPendingControlRequests(ctx: Context, nodeId: string, runId: string) {
  const result = await ctx.db.sequelize.transaction(async (transaction) => {
    const lease = await validateRunLease(ctx, nodeId, runId, getBodyValues(ctx), transaction);
    if (!lease) {
      return null;
    }
    const requests = (await ctx.db.getRepository('agRunControlRequests').find({
      filter: {
        runId,
        status: {
          $in: ['accepted', 'delivered'],
        },
      },
      sort: ['createdAt', 'id'],
      transaction,
    })) as ModelRecord[];
    return {
      requests: requests.map((request) => ({
        id: String(getModelTargetKey(request, 'id')),
        runId,
        action: getModelString(request, 'action') as 'interrupt' | 'terminate',
        status: getModelString(request, 'status') as 'accepted' | 'delivered',
        reason: getModelString(request, 'reason') || undefined,
        createdAt:
          getModelValue(request, 'createdAt') instanceof Date
            ? (getModelValue(request, 'createdAt') as Date).toISOString()
            : String(getModelValue(request, 'createdAt') || ''),
      })),
    };
  });
  if (result) {
    ctx.body = result;
  }
}

function getAckStatus(ctx: Context, value: unknown) {
  const status = getString(value);
  if (!CONTROL_REQUEST_STATUSES.has(status)) {
    ctx.throw(400, CONTROL_ERROR_CODES.unsupported);
  }
  return status as 'accepted' | 'delivered' | 'succeeded' | 'failed';
}

async function auditControlAckResult(
  ctx: Context,
  run: ModelRecord,
  request: ModelRecord,
  status: 'succeeded' | 'failed',
) {
  const action = getModelString(request, 'action') as 'interrupt' | 'terminate';
  await auditAgentActionBestEffort(ctx, {
    action,
    runId: getModelString(run, 'id'),
    sessionId: getModelString(run, 'agentSessionId') || undefined,
    operatorId: getModelValue(request, 'requestedById') as string | number | undefined,
    permissionKey: getControlPermissionKey(action),
    resultStatus: status,
    provider: getModelString(run, 'agentSessionProvider') || undefined,
    metadataJson: {
      controlRequestId: getModelTargetKey(request, 'id'),
      ackedByNodeId: getModelString(run, 'nodeId') || undefined,
    },
  });
}

async function ackControlRequest(ctx: Context, nodeId: string, runId: string, requestId: string) {
  const values = getBodyValues(ctx);
  const ackStatus = getAckStatus(ctx, values.status);
  const result = await ctx.db.sequelize.transaction(async (transaction) => {
    const lease = await validateRunLease(ctx, nodeId, runId, values, transaction);
    if (!lease) {
      return null;
    }
    const request = (await ctx.db.getRepository('agRunControlRequests').findOne({
      filterByTk: requestId,
      transaction,
      lock: transaction.LOCK.UPDATE,
    })) as ModelRecord | null;
    if (!request || getModelString(request, 'runId') !== runId) {
      ctx.throw(404, 'Control request not found');
    }
    const action = getModelString(request, 'action');
    if (action !== 'interrupt' && action !== 'terminate') {
      ctx.throw(409, 'Unsupported control request action');
    }
    const currentStatus = getModelString(request, 'status');
    if (ackStatus === 'accepted') {
      ctx.throw(400, CONTROL_ERROR_CODES.requestAccepted);
    }
    if (currentStatus === 'succeeded' || currentStatus === 'failed') {
      if (ackStatus !== currentStatus) {
        ctx.throw(409, 'Control request already completed');
      }
      return {
        run: lease.run,
        request,
        finalAuditStatus: null,
      };
    }
    if (currentStatus === 'accepted' && ackStatus !== 'delivered') {
      ctx.throw(409, 'Control request must be delivered before final ack');
    }
    if (currentStatus === 'delivered' && ackStatus === 'delivered') {
      return {
        run: lease.run,
        request,
        finalAuditStatus: null,
      };
    }
    const now = new Date();
    const updates: JsonRecord = {
      status: ackStatus,
      resultMessage: getString(values.resultMessage)
        ? redactObservabilityText(getString(values.resultMessage))
        : getModelValue(request, 'resultMessage'),
      metadataJson: getRecord(redactEventPayload(values.metadataJson)),
    };
    if (ackStatus === 'delivered' || ackStatus === 'succeeded' || ackStatus === 'failed') {
      updates.deliveredAt = getModelValue(request, 'deliveredAt') || now;
    }
    if (ackStatus === 'succeeded' || ackStatus === 'failed') {
      updates.completedAt = now;
    }
    await ctx.db.getRepository('agRunControlRequests').update({
      filterByTk: requestId,
      values: updates,
      transaction,
    });
    const updated = (await ctx.db.getRepository('agRunControlRequests').findOne({
      filterByTk: requestId,
      transaction,
    })) as ModelRecord;
    if (ackStatus === 'delivered' || ackStatus === 'succeeded' || ackStatus === 'failed') {
      await updateTerminalLastActivity(ctx, runId, transaction);
      await appendTerminalControlEvent(
        ctx,
        lease.run,
        `terminal.${getModelString(updated, 'action')}.${ackStatus}`,
        {
          controlRequestId: getModelTargetKey(updated, 'id'),
        },
        transaction,
      );
    }
    return {
      run: lease.run,
      request: updated,
      finalAuditStatus: ackStatus === 'succeeded' || ackStatus === 'failed' ? ackStatus : null,
    };
  });
  if (!result) {
    return;
  }
  if (result.finalAuditStatus) {
    await auditControlAckResult(ctx, result.run, result.request, result.finalAuditStatus);
  }
  ctx.body = serializeControlRequest(result.request);
}

function getTerminalUpdateValues(ctx: Context, values: JsonRecord) {
  const updates: JsonRecord = {};
  const backend = getString(values.terminalBackend);
  const sessionName = getString(values.terminalSessionName);
  const terminalStatus = getString(values.terminalStatus);

  if (backend) {
    if (!TERMINAL_BACKENDS.has(backend)) {
      ctx.throw(400, 'Unsupported terminal backend');
    }
    updates.terminalBackend = backend;
  }
  if (sessionName) {
    if (!isManagedTmuxSessionName(sessionName)) {
      ctx.throw(400, 'Invalid terminal session name');
    }
    updates.terminalSessionName = sessionName;
  }
  if (terminalStatus) {
    if (!TERMINAL_STATUSES.has(terminalStatus)) {
      ctx.throw(400, 'Unsupported terminal status');
    }
    updates.terminalStatus = terminalStatus;
  }
  for (const key of ['terminalStartedAt', 'terminalEndedAt', 'terminalLastActivityAt'] as const) {
    const date = getDate(values[key]);
    if (date) {
      updates[key] = date;
    }
  }
  if (values.terminalExitCode !== undefined) {
    updates.terminalExitCode = getOptionalInteger(ctx, values.terminalExitCode, 'terminalExitCode');
  }
  if (terminalStatus === 'active' && !updates.terminalLastActivityAt) {
    updates.terminalLastActivityAt = new Date();
  }
  if (!Object.keys(updates).length) {
    ctx.throw(400, 'No terminal update values provided');
  }
  return updates;
}

async function updateRunTerminal(ctx: Context, nodeId: string, runId: string) {
  const values = getBodyValues(ctx);
  const result = await ctx.db.sequelize.transaction(async (transaction) => {
    const lease = await validateRunLease(ctx, nodeId, runId, values, transaction);
    if (!lease) {
      return null;
    }
    const updates = getTerminalUpdateValues(ctx, values);
    await ctx.db.getRepository('agRuns').update({
      filterByTk: runId,
      values: updates,
      transaction,
    });
    const run = await findRun(ctx, runId, transaction);
    return serializeRun(run);
  });
  if (result) {
    ctx.body = result;
  }
}

export function registerRunTerminalRoutes(plugin: Plugin) {
  plugin.app.use(
    async (ctx: Context, next: Next) => {
      if (!ctx.path.startsWith(API_PREFIX)) {
        await next();
        return;
      }

      const routePath = ctx.path.slice(API_PREFIX.length);
      const terminalSnapshotMatch = routePath.match(/^\/runs\/([^/]+)\/terminal:snapshot$/);
      const terminalActionMatch = routePath.match(/^\/runs\/([^/]+)\/terminal:(send|write|interrupt|terminate)$/);
      const terminalUpdateMatch = routePath.match(/^\/nodes\/([^/]+)\/runs\/([^/]+)\/terminal:update$/);
      const controlStatusMatch = routePath.match(/^\/runs\/([^/]+)\/control-requests\/([^/]+):get$/);
      const controlPendingMatch = routePath.match(/^\/nodes\/([^/]+)\/runs\/([^/]+)\/control-requests:pending$/);
      const controlAckMatch = routePath.match(/^\/nodes\/([^/]+)\/runs\/([^/]+)\/control-requests\/([^/]+):ack$/);

      if (ctx.method === 'GET' && terminalSnapshotMatch) {
        const runId = terminalSnapshotMatch[1];
        assertRunId(ctx, runId);
        await snapshotTerminal(ctx, runId);
        return;
      }

      if (ctx.method === 'POST' && terminalActionMatch) {
        const [, runId, action] = terminalActionMatch;
        assertRunId(ctx, runId);
        if (action === 'send' || action === 'write') {
          await sendTerminalInput(ctx, runId, action === 'send' ? 'terminal:send' : 'terminal:write');
          return;
        }
        if (action === 'interrupt') {
          await interruptTerminal(ctx, runId);
          return;
        }
        if (action === 'terminate') {
          await terminateTerminal(ctx, runId);
          return;
        }
      }

      if (ctx.method === 'POST' && terminalUpdateMatch) {
        const [, nodeId, runId] = terminalUpdateMatch;
        assertRunId(ctx, runId);
        await updateRunTerminal(ctx, nodeId, runId);
        return;
      }

      if (ctx.method === 'GET' && controlStatusMatch) {
        const [, runId, requestId] = controlStatusMatch;
        assertRunId(ctx, runId);
        await getControlRequestStatus(ctx, runId, requestId);
        return;
      }

      if (ctx.method === 'POST' && controlPendingMatch) {
        const [, nodeId, runId] = controlPendingMatch;
        assertRunId(ctx, runId);
        await listPendingControlRequests(ctx, nodeId, runId);
        return;
      }

      if (ctx.method === 'POST' && controlAckMatch) {
        const [, nodeId, runId, requestId] = controlAckMatch;
        assertRunId(ctx, runId);
        await ackControlRequest(ctx, nodeId, runId, requestId);
        return;
      }

      await next();
    },
    {
      tag: 'agentGatewayRunTerminalRoutes',
      after: 'agentGatewayRunLifecycleRoutes',
      before: 'agentGatewayRunObservabilityRoutes',
    },
  );
}
