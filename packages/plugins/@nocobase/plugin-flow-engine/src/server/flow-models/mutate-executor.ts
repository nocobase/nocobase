/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import FlowModelRepository from '../repository';
import { respondWithFlowModelOperationError } from './http-error-adapter';
import { emitFlowModelTransactionRollback } from './repository-internals/ensure-lock';
import { FlowModelOperationError } from './repository-internals/errors';
import { FlowModelValidationFacade } from './validation-facade';

export function createFlowModelsMutateTransactionMiddleware() {
  return async (ctx: any, next: () => Promise<void>) => {
    const isFlowModelsMutate = ctx?.action?.resourceName === 'flowModels' && ctx?.action?.actionName === 'mutate';
    if (!isFlowModelsMutate) {
      return next();
    }

    const previousTransaction = ctx.transaction;
    const previousMutateMeta = ctx.state?.flowModelsMutateMeta;
    const ownsTransaction = !previousTransaction;
    const transaction = previousTransaction || (await ctx.db.sequelize.transaction());
    ctx.transaction = transaction;

    try {
      await next();
      if (ownsTransaction) {
        await transaction.commit();
      }
    } catch (error) {
      if (ownsTransaction) {
        await transaction.rollback();
        await emitFlowModelTransactionRollback(ctx.db, transaction);
      }
      if (error instanceof FlowModelOperationError && ownsTransaction) {
        respondWithFlowModelOperationError(ctx, error);
        return;
      }
      throw error;
    } finally {
      if (ctx.state) {
        if (previousMutateMeta === undefined) {
          delete ctx.state.flowModelsMutateMeta;
        } else {
          ctx.state.flowModelsMutateMeta = previousMutateMeta;
        }
      }
      if (previousTransaction === undefined) {
        delete ctx.transaction;
      } else {
        ctx.transaction = previousTransaction;
      }
    }
  };
}

export async function executeFlowModelsMutate(options: {
  ctx: any;
  repository: FlowModelRepository;
  validationFacade: FlowModelValidationFacade;
  includeAsyncNode?: boolean;
}) {
  const { ctx, repository, validationFacade } = options;
  const includeAsyncNode = !!options.includeAsyncNode;
  const { values } = ctx.action.params as any;

  const atomic = values?.atomic;
  const ops = values?.ops;
  const returnModels = values?.returnModels;

  if (atomic !== true) {
    ctx.throw(400, "flowModels:mutate requires 'atomic=true'", {
      code: 'INVALID_PARAMS',
    });
  }
  if (!Array.isArray(ops) || ops.length === 0) {
    ctx.throw(400, "flowModels:mutate requires non-empty 'ops' array", {
      code: 'INVALID_PARAMS',
    });
  }

  const seenOpIds = new Set<string>();
  for (let i = 0; i < ops.length; i++) {
    const opId = String(ops[i]?.opId || '').trim();
    if (!opId) {
      ctx.throw(400, `flowModels:mutate ops[${i}].opId is required`, {
        code: 'INVALID_PARAMS',
      });
    }
    if (seenOpIds.has(opId)) {
      ctx.throw(400, `flowModels:mutate duplicate opId '${opId}'`, {
        code: 'INVALID_PARAMS',
      });
    }
    seenOpIds.add(opId);
  }

  const outputsByOpId = new Map<string, any>();
  const transaction = ctx.transaction;
  const destroyedNodesByOpId: Record<string, Array<{ uid?: string }>> = {};

  ctx.state ||= {};
  ctx.state.flowModelsMutateMeta = {
    ...(ctx.state.flowModelsMutateMeta && typeof ctx.state.flowModelsMutateMeta === 'object'
      ? ctx.state.flowModelsMutateMeta
      : {}),
    destroyedNodesByOpId,
  };

  if (!transaction) {
    ctx.throw(500, 'Missing flowModels:mutate transaction', {
      code: 'INTERNAL_ERROR',
    });
  }

  const resolveRefs = (input: any, meta: { opId: string; opIndex: number }): any => {
    if (typeof input === 'string' && input.startsWith('$ref:')) {
      const ref = input.slice('$ref:'.length);
      const dotIndex = ref.indexOf('.');
      const refOpId = dotIndex > 0 ? ref.slice(0, dotIndex).trim() : '';
      const refPath = dotIndex > 0 ? ref.slice(dotIndex + 1).trim() : '';
      if (!refOpId || !refPath) {
        throw new FlowModelOperationError({
          status: 400,
          code: 'INVALID_PARAMS',
          message: `flowModels:mutate invalid ref string '${input}'`,
          details: { ...meta, ref: input },
        });
      }
      const output = outputsByOpId.get(refOpId);
      if (!output) {
        throw new FlowModelOperationError({
          status: 400,
          code: 'INVALID_PARAMS',
          message: `flowModels:mutate ref opId '${refOpId}' not found`,
          details: { ...meta, ref: input, refOpId, refPath },
        });
      }
      const resolved = _.get(output, refPath);
      if (resolved === undefined) {
        throw new FlowModelOperationError({
          status: 400,
          code: 'INVALID_PARAMS',
          message: `flowModels:mutate ref path '${refPath}' not found on opId '${refOpId}' output`,
          details: { ...meta, ref: input, refOpId, refPath },
        });
      }
      return resolved;
    }
    if (Array.isArray(input)) {
      return input.map((item) => resolveRefs(item, meta));
    }
    if (input && typeof input === 'object') {
      const entries = Object.entries(input as Record<string, any>).map(([k, v]) => [k, resolveRefs(v, meta)]);
      return Object.fromEntries(entries);
    }
    return input;
  };

  type FlowModelsMutateOpMeta = { opId: string; opIndex: number };

  const opHandlers: Record<string, (params: any, meta: FlowModelsMutateOpMeta) => Promise<any>> = {
    ensure: async (params) => {
      const normalizedParams = await validationFacade.prepareEnsureValues(params, repository, {
        transaction,
      });
      return await repository.ensureModel(normalizedParams, { transaction, includeAsyncNode });
    },
    upsert: async (params) => {
      const modelValues = params?.values;
      const modelUid = String(modelValues?.uid || '').trim();
      if (!modelUid) {
        throw new FlowModelOperationError({
          status: 400,
          code: 'INVALID_PARAMS',
          message: "flowModels:mutate upsert requires 'params.values.uid' for retry-safety",
        });
      }
      const normalizedModelValues = validationFacade.assertValidFlowModelSchema(modelValues);
      await repository.upsertModel(normalizedModelValues, { transaction });
      return await repository.findModelById(modelUid, { transaction, includeAsyncNode });
    },
    destroy: async (params, meta) => {
      const uid = String(params?.uid || '').trim();
      if (!uid) {
        throw new FlowModelOperationError({
          status: 400,
          code: 'INVALID_PARAMS',
          message: "flowModels:mutate destroy requires 'params.uid'",
        });
      }
      const nodesToDestroy = await repository.findNodesById(uid, {
        includeAsyncNode: true,
        transaction,
      });
      destroyedNodesByOpId[meta.opId] = _.uniqBy(nodesToDestroy, 'uid').map((node) => ({ uid: node.uid }));
      await repository.remove(uid, { transaction });
      return { ok: true, uid };
    },
    attach: async (params) => {
      return await repository.attach(
        String(params?.uid || ''),
        {
          parentId: String(params?.parentId || ''),
          subKey: String(params?.subKey || ''),
          subType: params?.subType,
          position: params?.position,
        } as any,
        { transaction },
      );
    },
    move: async (params) => {
      await repository.move(
        {
          sourceId: String(params?.sourceId || ''),
          targetId: String(params?.targetId || ''),
          position: params?.position,
        },
        { transaction },
      );
      return { ok: true };
    },
    duplicate: async (params) => {
      return await repository.duplicateWithTargetUid(String(params?.uid || ''), String(params?.targetUid || ''), {
        transaction,
        includeAsyncNode,
      });
    },
  };

  const results: Array<{ opId: string; ok: boolean; output?: any }> = [];

  for (let i = 0; i < ops.length; i++) {
    const op = ops[i] || {};
    const opId = String(op.opId || '').trim();
    const type = String(op.type || '').trim();
    const meta = { opId, opIndex: i };

    if (!type) {
      throw new FlowModelOperationError({
        status: 400,
        code: 'INVALID_PARAMS',
        message: `flowModels:mutate ops[${i}].type is required`,
        details: meta,
      });
    }

    const params = resolveRefs(op.params || {}, meta);

    try {
      const handler = opHandlers[type];
      if (!handler) {
        throw new FlowModelOperationError({
          status: 400,
          code: 'INVALID_PARAMS',
          message: `flowModels:mutate unsupported op type '${type}'`,
        });
      }

      const output = await handler(params, meta);
      outputsByOpId.set(opId, output);
      results.push({ opId, ok: true, output });
    } catch (error) {
      if (error instanceof FlowModelOperationError) {
        throw new FlowModelOperationError({
          status: error.status,
          code: error.code,
          message: error.message,
          details: { ...(error.details || {}), ...meta },
        });
      }
      throw new FlowModelOperationError({
        status: 500,
        code: 'INTERNAL_ERROR',
        message: error?.message || 'Internal error',
        details: meta,
      });
    }
  }

  let models: Record<string, any> | undefined;
  if (Array.isArray(returnModels) && returnModels.length) {
    models = {};
    for (const uid of returnModels) {
      const modelUid = String(uid || '').trim();
      if (!modelUid) continue;
      models[modelUid] = await repository.findModelById(modelUid, { transaction, includeAsyncNode });
    }
  }

  ctx.body = {
    results,
    ...(models ? { models } : {}),
  };
}
