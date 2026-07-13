/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { randomUUID } from 'crypto';

import { Context } from '@nocobase/actions';
import { Transaction } from 'sequelize';

import { TerminalRunStatus } from '../../../shared/runState';
import { ModelRecord, getModelNumber, getModelString, getModelTargetKey } from '../../actions/utils';

async function appendTerminalControlFailedEvent(options: {
  ctx: Context;
  run: ModelRecord;
  request: ModelRecord;
  terminalStatus: TerminalRunStatus;
  transaction: Transaction;
}) {
  const runId = String(getModelTargetKey(options.run, 'id'));
  const source = 'terminal-control';
  const action = getModelString(options.request, 'action');
  if (action !== 'interrupt' && action !== 'terminate') {
    return;
  }
  const latestEvent = (await options.ctx.db.getRepository('agRunEvents').findOne({
    filter: {
      runId,
      source,
    },
    sort: ['-sequence'],
    transaction: options.transaction,
    lock: options.transaction.LOCK.UPDATE,
  })) as ModelRecord | null;
  const sequence = (latestEvent ? getModelNumber(latestEvent, 'sequence') : 0) + 1;
  const eventType = `terminal.${action}.failed`;
  await options.ctx.db.getRepository('agRunEvents').create({
    values: {
      id: randomUUID(),
      runId,
      claimAttempt: getModelNumber(options.run, 'claimAttempt'),
      source,
      sequence,
      level: 'info',
      eventType,
      message: eventType,
      payloadJson: {
        controlRequestId: getModelTargetKey(options.request, 'id'),
        reason: 'run-finished',
        terminalStatus: options.terminalStatus,
      },
      emittedAt: new Date(),
    },
    transaction: options.transaction,
  });
}

export async function failOpenControlRequestsForFinishedRun(options: {
  ctx: Context;
  run: ModelRecord;
  runId: string;
  terminalStatus: TerminalRunStatus;
  now: Date;
  transaction: Transaction;
}) {
  const requests = (await options.ctx.db.getRepository('agRunControlRequests').find({
    filter: {
      runId: options.runId,
      status: ['accepted', 'delivered'],
    },
    sort: ['createdAt', 'id'],
    transaction: options.transaction,
    lock: options.transaction.LOCK.UPDATE,
  })) as ModelRecord[];
  for (const request of requests) {
    await options.ctx.db.getRepository('agRunControlRequests').update({
      filterByTk: getModelTargetKey(request, 'id'),
      values: {
        status: 'failed',
        resultMessage: 'Run finished before control request completed',
        completedAt: options.now,
      },
      transaction: options.transaction,
    });
    await appendTerminalControlFailedEvent({
      ctx: options.ctx,
      run: options.run,
      request,
      terminalStatus: options.terminalStatus,
      transaction: options.transaction,
    });
  }
}
