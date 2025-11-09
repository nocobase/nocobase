/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { levelByDuration, logAt, serializeError, LoggerLike, isLevelEnabled as _isLevelEnabled } from './logging';

type CommonCtx = {
  modelId: string;
  modelType?: string;
  flowKey?: string;
  runId?: string;
  eventName?: string;
};

export type StepCtx = CommonCtx & {
  stepKey: string;
  stepType?: string;
};

export type EventStartCtx = CommonCtx & {
  flowsCount: number;
  options?: { sequential?: boolean; useCache?: boolean };
};

export type EventEndCtx = CommonCtx & {
  duration: number;
  resultsCount?: number;
};

export type EventFlowDispatchCtx = CommonCtx & {
  flowKey: string;
  mode: 'sequential' | 'parallel';
};

export type EventFlowErrorCtx = CommonCtx & {
  flowKey: string;
  error: unknown;
};

export function logStepStart(logger: LoggerLike, ctx: StepCtx) {
  // 早期短路：低级别日志在未启用时直接返回，避免构造 payload
  if (!_isLevelEnabled(logger, 'debug')) return;
  logger.debug({ type: 'step.start', ...ctx });
}

export function logStepEnd(logger: LoggerLike, ctx: StepCtx & { duration: number }, slowMs: number) {
  const level = levelByDuration(ctx.duration, slowMs);
  if (!_isLevelEnabled(logger, level)) return;
  const payload = { type: 'step.end', status: 'ok', ...ctx } as Record<string, unknown>;
  logAt(logger, level, payload);
}

export function logStepError(logger: LoggerLike, ctx: StepCtx, err: unknown) {
  const payload = { type: 'step.error', error: serializeError(err), ...ctx } as Record<string, unknown>;
  logger.error(payload, `BaseModel.applyFlow: Error executing step '${ctx.stepKey}' in flow '${ctx.flowKey}':`);
}

export function logEventStart(logger: LoggerLike, ctx: EventStartCtx) {
  if (!_isLevelEnabled(logger, 'debug')) return;
  logger.debug({ type: 'event.start', ...ctx });
}

export function logEventEnd(logger: LoggerLike, ctx: EventEndCtx, slowMs: number) {
  const level = levelByDuration(ctx.duration, slowMs);
  if (!_isLevelEnabled(logger, level)) return;
  const payload = { type: 'event.end', status: 'ok', ...ctx } as Record<string, unknown>;
  logAt(logger, level, payload);
}

export function logEventFlowDispatch(logger: LoggerLike, ctx: EventFlowDispatchCtx) {
  if (!_isLevelEnabled(logger, 'debug')) return;
  logger.debug({ type: 'event.flow.dispatch', ...ctx });
}

export function logEventFlowError(logger: LoggerLike, ctx: EventFlowErrorCtx) {
  logger.error(
    { type: 'event.flow.error', ...ctx, error: serializeError(ctx.error) },
    `BaseModel.dispatchEvent: Error executing event-triggered flow '${ctx.flowKey}' for event '${ctx.eventName}':`,
  );
}
