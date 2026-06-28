/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context } from '@nocobase/actions';
import type { Database } from '@nocobase/database';
import type { HandlerType, ResourceOptions } from '@nocobase/resourcer';

import { isVscError } from '../../shared/errors';
import {
  buildRunJSSourceRepositoryIdentity,
  normalizeRunJSSourceLocator,
  type RunJSSourceOpenResult,
} from '../../shared/runjs-source-types';
import type { RunJSSourceAdapterRegistry } from './RunJSSourceAdapterRegistry';

export const runJSSourceActionNames = ['open'] as const;

type RunJSSourceActionName = (typeof runJSSourceActionNames)[number];

type ResourceActionInput = Record<string, unknown>;

type RunJSSourceResourceContext = Context & {
  action?: {
    params?: unknown;
    resourceName?: string;
    actionName?: string;
  };
  auth?: {
    user?: unknown;
  };
  request?: {
    path?: string;
    method?: string;
    header?: Record<string, string | string[] | undefined>;
    headers?: Record<string, string | string[] | undefined>;
  };
  dataSource?: {
    name?: unknown;
  };
  withoutDataWrapping?: boolean;
  type?: string;
  status?: number;
  body?: unknown;
};

type RunJSSourceActionRunner = (
  db: Database,
  registry: RunJSSourceAdapterRegistry,
  input: ResourceActionInput,
  ctx: RunJSSourceResourceContext,
) => Promise<unknown>;

const actionRunners: Record<RunJSSourceActionName, RunJSSourceActionRunner> = {
  open: async (db, registry, input, ctx): Promise<RunJSSourceOpenResult> => {
    const locator = normalizeRunJSSourceLocator(input.locator);
    const adapter = registry.require(locator.kind);
    const legacy = await adapter.readLegacy(locator, {
      userId: getCurrentUserId(ctx),
      request: getRequestMetadata(ctx),
    });

    return {
      locator,
      locatorKind: locator.kind,
      repositoryIdentity: buildRunJSSourceRepositoryIdentity(locator),
      legacy,
      ownerFingerprint: legacy.ownerFingerprint || null,
    };
  },
};

export function createRunJSSourcesResource(db: Database, registry: RunJSSourceAdapterRegistry): ResourceOptions {
  return {
    name: 'runJSSources',
    only: [...runJSSourceActionNames],
    actions: Object.fromEntries(
      runJSSourceActionNames.map((actionName) => [
        actionName,
        createRunJSSourceAction(db, registry, actionRunners[actionName]),
      ]),
    ) as Record<RunJSSourceActionName, HandlerType>,
  };
}

function createRunJSSourceAction(
  db: Database,
  registry: RunJSSourceAdapterRegistry,
  run: RunJSSourceActionRunner,
): HandlerType {
  return async (ctx: Context, next) => {
    const resourceCtx = ctx as RunJSSourceResourceContext;

    try {
      resourceCtx.body = await run(db, registry, getActionInput(resourceCtx), resourceCtx);
      await next();
    } catch (error) {
      if (!isVscError(error)) {
        throw error;
      }

      resourceCtx.withoutDataWrapping = true;
      resourceCtx.type = 'application/json';
      resourceCtx.status = error.status;
      resourceCtx.body = error.toResponseBody();
    }
  };
}

function getActionInput(ctx: RunJSSourceResourceContext): ResourceActionInput {
  const params = toRecord(ctx.action?.params);
  const values = toRecord(params.values);
  const { values: _values, ...queryParams } = params;

  return {
    ...queryParams,
    ...values,
  };
}

function getCurrentUserId(ctx: RunJSSourceResourceContext): string | null {
  const user = ctx.auth?.user;
  if (!user || typeof user !== 'object') {
    return null;
  }

  const userWithId = user as { id?: unknown };
  if (typeof userWithId.id === 'string' || typeof userWithId.id === 'number') {
    return String(userWithId.id);
  }

  const get = (user as { get?: (key: string) => unknown }).get;
  if (typeof get !== 'function') {
    return null;
  }

  const id = get('id');
  return typeof id === 'string' || typeof id === 'number' ? String(id) : null;
}

function getRequestMetadata(ctx: RunJSSourceResourceContext): Record<string, unknown> {
  const headers = ctx.request?.headers || ctx.request?.header || {};

  return compactObject({
    resourceName: ctx.action?.resourceName,
    actionName: ctx.action?.actionName,
    path: ctx.request?.path,
    method: ctx.request?.method,
    requestSource: getHeader(headers, 'x-request-source'),
    locale: getHeader(headers, 'x-locale'),
    timezone: getHeader(headers, 'x-timezone'),
    dataSource: getHeader(headers, 'x-data-source') || toStringValue(ctx.dataSource?.name),
  });
}

function getHeader(headers: Record<string, string | string[] | undefined>, name: string): string | undefined {
  const value = headers[name] || headers[name.toLowerCase()];
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function toRecord(value: unknown): ResourceActionInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return value as ResourceActionInput;
}

function compactObject(input: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined));
}

function toStringValue(value: unknown): string | undefined {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }

  return undefined;
}
