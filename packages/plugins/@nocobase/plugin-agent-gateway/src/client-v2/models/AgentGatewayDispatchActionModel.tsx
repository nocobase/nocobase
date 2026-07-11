/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { ButtonProps } from 'antd';

import { NAMESPACE, tExpr } from '../locale';
import { FlowCollectionLike, getCollectionFromContext, getCollectionNameFromContext } from '../utils/collectionContext';

interface DispatchActionParams {
  bindingIdentifier?: string;
  bindingId?: string;
  bindingKey?: string;
}

interface DispatchApiResponse {
  bindingId?: string;
  bindingKey?: string;
  idempotent?: boolean;
  deduped?: boolean;
  runId?: string;
  runCode?: string;
  agentSessionId?: string | null;
  sourceCollection?: string;
  sourceRecordId?: string;
  outputAgentRunField?: string;
  relationUpdated?: boolean;
  run?: {
    id: string;
    status?: string;
  };
}

interface AgentGatewayApiResponse<T> {
  data?: {
    data?: T;
  };
}

interface AgentGatewayApi {
  request<T>(config: {
    url: string;
    method: 'post';
    data?: Record<string, unknown>;
  }): Promise<AgentGatewayApiResponse<T>>;
}

interface AgentGatewayMessage {
  success(content: string): void;
  error(content: string): void;
  warning?(content: string): void;
}

interface RefreshableResource {
  refresh(): Promise<unknown> | unknown;
}

interface DispatchActionContext {
  api: AgentGatewayApi;
  message?: AgentGatewayMessage;
  filterByTk?: unknown;
  record?: Record<string, unknown>;
  model?: {
    context?: {
      record?: Record<string, unknown>;
      collection?: FlowCollectionLike;
      blockModel?: {
        collection?: FlowCollectionLike;
      };
    };
    collection?: FlowCollectionLike;
  };
  blockModel?: {
    collection?: FlowCollectionLike;
    resource?: RefreshableResource;
  };
  collection?: FlowCollectionLike;
  t?: (key: string, options?: Record<string, unknown>) => string;
}

const pendingDispatches = new Set<string>();
const dispatchIdempotencyKeys = new Map<string, string>();

function getString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function getRecordKeyValue(value: unknown) {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'bigint') {
    const key = String(value).trim();
    if (key) {
      return key;
    }
  }
  return '';
}

function t(ctx: DispatchActionContext, key: string) {
  return ctx.t ? ctx.t(key, { ns: NAMESPACE }) : key;
}

function createIdempotencyKey(bindingIdentifier: string, recordId: string) {
  const pendingKey = getPendingKey(bindingIdentifier, recordId);
  const existing = dispatchIdempotencyKeys.get(pendingKey);
  if (existing) {
    return existing;
  }

  const randomValue = globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
  const idempotencyKey = `dispatch:${bindingIdentifier}:${recordId}:${randomValue}`;
  dispatchIdempotencyKeys.set(pendingKey, idempotencyKey);
  return idempotencyKey;
}

function getPendingKey(bindingIdentifier: string, recordId: string) {
  return `${bindingIdentifier}:${recordId}`;
}

function getRuntimeCollectionName(ctx: DispatchActionContext) {
  return getCollectionNameFromContext(ctx);
}

function getRuntimeCollection(ctx: DispatchActionContext) {
  return getCollectionFromContext(ctx);
}

function getRuntimeRecord(ctx: DispatchActionContext) {
  return ctx.record || ctx.model?.context?.record;
}

function getRecordFilterByTk(ctx: DispatchActionContext) {
  const directFilterByTk = getRecordKeyValue(ctx.filterByTk);
  if (directFilterByTk) {
    return directFilterByTk;
  }

  const record = getRuntimeRecord(ctx);
  if (!record) {
    return '';
  }

  const collection = getRuntimeCollection(ctx);
  const collectionFilterByTk = getRecordKeyValue(collection?.getFilterByTK?.(record));
  if (collectionFilterByTk) {
    return collectionFilterByTk;
  }

  const filterTargetKey = collection?.filterTargetKey;
  if (typeof filterTargetKey === 'string') {
    const filterTargetValue = getRecordKeyValue(record[filterTargetKey]);
    if (filterTargetValue) {
      return filterTargetValue;
    }
  }

  return getRecordKeyValue(record.id);
}

function getApiErrorMessage(error: unknown, fallback: string) {
  const response = error && typeof error === 'object' ? (error as { response?: unknown }).response : undefined;
  const data = response && typeof response === 'object' ? (response as { data?: unknown }).data : undefined;
  const errors =
    data && typeof data === 'object' && Array.isArray((data as { errors?: unknown }).errors)
      ? ((data as { errors: unknown[] }).errors as unknown[])
      : [];
  const firstError = errors[0] && typeof errors[0] === 'object' ? (errors[0] as { message?: unknown }) : null;
  if (typeof firstError?.message === 'string' && firstError.message) {
    return firstError.message;
  }
  return error instanceof Error && error.message ? error.message : fallback;
}

export async function dispatchAgentGatewayRun(ctx: DispatchActionContext, params: DispatchActionParams) {
  const bindingIdentifier = getString(params.bindingIdentifier || params.bindingId || params.bindingKey);
  if (!bindingIdentifier) {
    ctx.message?.error(t(ctx, 'Dispatch binding is required'));
    return null;
  }

  const recordId = getRecordFilterByTk(ctx);
  if (!recordId) {
    ctx.message?.error(t(ctx, 'Record ID is required'));
    return null;
  }

  const pendingKey = getPendingKey(bindingIdentifier, recordId);
  const sourceCollection = getRuntimeCollectionName(ctx);
  if (!sourceCollection) {
    ctx.message?.error(t(ctx, 'Record collection is required'));
    return null;
  }
  if (pendingDispatches.has(pendingKey)) {
    ctx.message?.warning?.(t(ctx, 'Agent Gateway dispatch is already running'));
    return null;
  }

  pendingDispatches.add(pendingKey);
  try {
    const response = await ctx.api.request<DispatchApiResponse>({
      url: `agent-gateway/dispatch-bindings/${encodeURIComponent(bindingIdentifier)}/dispatch`,
      method: 'post',
      data: {
        sourceRecordId: recordId,
        idempotencyKey: createIdempotencyKey(bindingIdentifier, recordId),
        sourceCollection,
      },
    });

    const resource = ctx.blockModel?.resource;
    if (resource) {
      await resource.refresh();
    }
    const dispatch = response.data?.data;
    ctx.message?.success(
      t(
        ctx,
        dispatch?.deduped || dispatch?.idempotent ? 'Agent Gateway run already exists' : 'Agent Gateway run dispatched',
      ),
    );
    return dispatch || null;
  } catch (error) {
    ctx.message?.error(getApiErrorMessage(error, t(ctx, 'Failed to dispatch Agent Gateway run')));
    throw error;
  } finally {
    pendingDispatches.delete(pendingKey);
  }
}

export class AgentGatewayDispatchActionModel extends ActionModel {
  static scene = ActionSceneEnum.record;

  defaultProps: ButtonProps = {
    children: tExpr('Dispatch Agent Run'),
  };
}

AgentGatewayDispatchActionModel.define({
  label: tExpr('Dispatch Agent Run'),
});

AgentGatewayDispatchActionModel.registerFlow({
  key: 'agentGatewayDispatch',
  title: tExpr('Dispatch Agent Run'),
  on: 'click',
  steps: {
    dispatch: {
      title: tExpr('Dispatch'),
      uiSchema: {
        bindingIdentifier: {
          type: 'string',
          title: tExpr('Dispatch binding'),
          'x-decorator': 'FormItem',
          'x-component': 'AgentGatewayDispatchBindingSelect',
          required: true,
        },
      },
      async handler(ctx, params) {
        await dispatchAgentGatewayRun(ctx as unknown as DispatchActionContext, params as DispatchActionParams);
      },
    },
  },
});

export default AgentGatewayDispatchActionModel;
