/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { randomUUID } from 'crypto';

import { Context, Next } from '@nocobase/actions';
import { Plugin } from '@nocobase/server';
import type { Transaction } from 'sequelize';

import {
  captureTmuxSession,
  interruptTmuxSession,
  isManagedTmuxSessionName,
  sendTmuxInput,
  terminateTmuxSession,
} from '../../daemon/tmuxTerminal';
import { AGENT_GATEWAY_ACTIONS } from '../security';
import {
  API_PREFIX,
  JsonRecord,
  ModelRecord,
  getBodyValues,
  getDate,
  getModelJson,
  getModelNumber,
  getModelString,
  getModelTargetKey,
  getRecord,
  getString,
  requireAgentGatewayPermission,
} from './utils';
import { cancelRun, validateRunLease } from './runLifecycle';

const MAX_TERMINAL_INPUT_CHARS = 4000;
const DEFAULT_CAPTURE_LINES = 2000;
const MAX_CAPTURE_LINES = 5000;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TERMINAL_BACKENDS = new Set(['tmux']);
const TERMINAL_STATUSES = new Set(['active', 'closed', 'unavailable']);
const TERMINAL_INPUT_RUN_STATUSES = new Set(['claimed', 'syncing_skills', 'running']);

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

async function requireRunDetailsRead(ctx: Context) {
  await requireAgentGatewayPermission(
    ctx,
    AGENT_GATEWAY_ACTIONS.readRunDetails,
    'Agent Gateway run detail read permission required',
  );
}

async function requireTerminalControl(ctx: Context) {
  await requireAgentGatewayPermission(
    ctx,
    AGENT_GATEWAY_ACTIONS.cancelRun,
    'Agent Gateway terminal control permission required',
  );
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

function isTerminalInputEnabled(run: ModelRecord) {
  return (
    getModelString(run, 'terminalBackend') === 'tmux' &&
    getModelString(run, 'terminalStatus') === 'active' &&
    TERMINAL_INPUT_RUN_STATUSES.has(getModelString(run, 'status'))
  );
}

function getTerminalSnapshotBody(run: ModelRecord, snapshot: Awaited<ReturnType<typeof captureTmuxSession>> | null) {
  const sessionName = getModelString(run, 'terminalSessionName');
  return {
    backend: getModelString(run, 'terminalBackend') || null,
    sessionName: sessionName || null,
    terminalStatus: getModelString(run, 'terminalStatus') || null,
    runStatus: getModelString(run, 'status'),
    available: Boolean(snapshot?.available),
    output: snapshot?.output || '',
    capturedAt: snapshot?.capturedAt || new Date().toISOString(),
    inputEnabled: isTerminalInputEnabled(run) && Boolean(snapshot?.available),
  };
}

async function updateTerminalLastActivity(ctx: Context, runId: string) {
  await ctx.db.getRepository('agRuns').update({
    filterByTk: runId,
    values: {
      terminalLastActivityAt: new Date(),
    },
  });
}

async function appendTerminalControlEvent(ctx: Context, run: ModelRecord, eventType: string, payloadJson: JsonRecord) {
  const runId = String(getModelTargetKey(run, 'id'));
  const source = 'terminal-control';
  await ctx.db.sequelize.transaction(async (transaction) => {
    const latestEvent = (await ctx.db.getRepository('agRunEvents').findOne({
      filter: {
        runId,
        source,
      },
      sort: ['-sequence'],
      transaction,
      lock: transaction.LOCK.UPDATE,
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
      transaction,
    });
  });
}

async function snapshotTerminal(ctx: Context, runId: string) {
  await requireRunDetailsRead(ctx);
  const run = await findRun(ctx, runId);
  const sessionName = getTerminalSessionName(ctx, run);
  if (getModelString(run, 'terminalBackend') !== 'tmux' || !sessionName) {
    ctx.body = getTerminalSnapshotBody(run, null);
    return;
  }

  const snapshot = await captureTmuxSession(sessionName, getCaptureLines(ctx));
  ctx.body = getTerminalSnapshotBody(run, snapshot);
}

function getTerminalInput(ctx: Context, values: JsonRecord) {
  if (values.input === undefined || values.input === null) {
    return '';
  }
  if (typeof values.input !== 'string') {
    ctx.throw(400, 'input must be a string');
  }
  if (values.input.length > MAX_TERMINAL_INPUT_CHARS) {
    ctx.throw(413, 'Terminal input is too large');
  }
  return values.input;
}

async function sendTerminalInput(ctx: Context, runId: string) {
  await requireTerminalControl(ctx);
  const values = getBodyValues(ctx);
  const input = getTerminalInput(ctx, values);
  const appendEnter = values.appendEnter === undefined ? true : getBoolean(values.appendEnter);
  if (!input && !appendEnter) {
    ctx.throw(400, 'input or appendEnter is required');
  }

  const run = await findRun(ctx, runId);
  const sessionName = getTerminalSessionName(ctx, run);
  if (!sessionName || !isTerminalInputEnabled(run)) {
    ctx.throw(409, 'Run terminal is not accepting input');
  }

  await sendTmuxInput(sessionName, input, appendEnter);
  await updateTerminalLastActivity(ctx, runId);
  await appendTerminalControlEvent(ctx, run, 'terminal.input.sent', {
    sizeBytes: Buffer.byteLength(input),
    appendEnter,
  });
  ctx.body = {
    success: true,
  };
}

async function interruptTerminal(ctx: Context, runId: string) {
  await requireTerminalControl(ctx);
  const run = await findRun(ctx, runId);
  const sessionName = getTerminalSessionName(ctx, run);
  if (!sessionName || !isTerminalInputEnabled(run)) {
    ctx.throw(409, 'Run terminal is not active');
  }

  await interruptTmuxSession(sessionName);
  await updateTerminalLastActivity(ctx, runId);
  await appendTerminalControlEvent(ctx, run, 'terminal.interrupt.sent', {});
  ctx.body = {
    success: true,
  };
}

async function terminateTerminal(ctx: Context, runId: string) {
  await requireTerminalControl(ctx);
  const run = await findRun(ctx, runId);
  const sessionName = getTerminalSessionName(ctx, run);
  await cancelRun(ctx, runId);
  if (sessionName) {
    await terminateTmuxSession(sessionName);
    await appendTerminalControlEvent(ctx, run, 'terminal.terminate.sent', {});
  }
  ctx.body = {
    run: ctx.body,
    terminalTerminated: Boolean(sessionName),
  };
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
      const terminalActionMatch = routePath.match(/^\/runs\/([^/]+)\/terminal:(send|interrupt|terminate)$/);
      const terminalUpdateMatch = routePath.match(/^\/nodes\/([^/]+)\/runs\/([^/]+)\/terminal:update$/);

      if (ctx.method === 'GET' && terminalSnapshotMatch) {
        const runId = terminalSnapshotMatch[1];
        assertRunId(ctx, runId);
        await snapshotTerminal(ctx, runId);
        return;
      }

      if (ctx.method === 'POST' && terminalActionMatch) {
        const [, runId, action] = terminalActionMatch;
        assertRunId(ctx, runId);
        if (action === 'send') {
          await sendTerminalInput(ctx, runId);
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

      await next();
    },
    {
      tag: 'agentGatewayRunTerminalRoutes',
      after: 'agentGatewayRunLifecycleRoutes',
      before: 'agentGatewayRunObservabilityRoutes',
    },
  );
}
