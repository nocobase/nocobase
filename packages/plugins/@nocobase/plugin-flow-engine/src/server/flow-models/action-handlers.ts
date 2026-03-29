/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowSchemaService } from '../flow-schema-service';
import FlowModelRepository from '../repository';
import { respondWithFlowModelOperationError } from './http-error-adapter';
import { executeFlowModelsMutate } from './mutate-executor';
import { FlowModelOperationError } from './repository-internals/errors';
import { FlowModelValidationFacade } from './validation-facade';

function normalizeSchemaDetail(value: any) {
  return String(value || '').trim() === 'full' ? 'full' : 'compact';
}

async function runFlowModelAction(ctx: any, operation: () => Promise<void>): Promise<boolean> {
  try {
    await operation();
    return true;
  } catch (error) {
    if (error instanceof FlowModelOperationError) {
      respondWithFlowModelOperationError(ctx, error);
      return false;
    }
    throw error;
  }
}

export function createFlowModelActions(options: {
  flowSchemaService: FlowSchemaService;
  validationFacade: FlowModelValidationFacade;
}) {
  const { flowSchemaService, validationFacade } = options;

  return {
    findOne: async (ctx: any, next: () => Promise<void>) => {
      const { uid, parentId, subKey, includeAsyncNode = false } = ctx.action.params;
      const repository = ctx.db.getCollection('flowModels').repository as FlowModelRepository;
      if (uid) {
        ctx.body = await repository.findModelById(uid, { includeAsyncNode });
      } else if (parentId) {
        ctx.body = await repository.findModelByParentId(parentId, { subKey, includeAsyncNode });
      }
      await next();
    },
    duplicate: async (ctx: any, next: () => Promise<void>) => {
      const { uid } = ctx.action.params;
      const repository = ctx.db.getCollection('flowModels').repository as FlowModelRepository;
      ctx.body = await repository.duplicate(uid);
      await next();
    },
    schema: async (ctx: any, next: () => Promise<void>) => {
      const { use, detail } = ctx.action.params as any;
      const modelUse = String(use || '').trim();
      if (!modelUse) {
        ctx.throw(400, "flowModels:schema requires non-empty 'use'", {
          code: 'INVALID_PARAMS',
        });
      }
      const document = flowSchemaService.getPublicDocument(modelUse, {
        clone: false,
        detail: normalizeSchemaDetail(detail),
      });
      if (!document) {
        ctx.throw(404, `No flow schema document found for use "${modelUse}"`, {
          code: 'FLOW_MODEL_SCHEMA_NOT_FOUND',
        });
      }
      ctx.body = document;
      await next();
    },
    schemas: async (ctx: any, next: () => Promise<void>) => {
      const payload = (ctx.action.params as any)?.values ?? (ctx.action.params as any) ?? {};
      const uses = Array.isArray(payload?.uses)
        ? payload.uses.map((item) => String(item || '').trim()).filter(Boolean)
        : [];
      ctx.body = flowSchemaService.getPublicDocuments(uses, {
        clone: false,
        detail: normalizeSchemaDetail(payload?.detail),
      });
      await next();
    },
    schemaBundle: async (ctx: any, next: () => Promise<void>) => {
      const payload = (ctx.action.params as any)?.values ?? (ctx.action.params as any) ?? {};
      const uses = Array.isArray(payload?.uses)
        ? payload.uses.map((item) => String(item || '').trim()).filter(Boolean)
        : [];
      ctx.body = flowSchemaService.getBundle(uses);
      await next();
    },
    attach: async (ctx: any, next: () => Promise<void>) => {
      const { uid, parentId, subKey, subType, position } = ctx.action.params;
      const repository = ctx.db.getCollection('flowModels').repository as FlowModelRepository;
      const ok = await runFlowModelAction(ctx, async () => {
        ctx.body = await repository.attach(
          String(uid || '').trim(),
          {
            parentId: String(parentId || '').trim(),
            subKey: String(subKey || '').trim(),
            subType,
            position,
          },
          { transaction: ctx.transaction },
        );
      });
      if (!ok) {
        return;
      }
      await next();
    },
    move: async (ctx: any, next: () => Promise<void>) => {
      const { sourceId, targetId, position } = ctx.action.params;
      const repository = ctx.db.getCollection('flowModels').repository as FlowModelRepository;
      const ok = await runFlowModelAction(ctx, async () => {
        await repository.move(
          {
            sourceId,
            targetId,
            position,
          },
          { transaction: ctx.transaction },
        );
        ctx.body = 'ok';
      });
      if (!ok) {
        return;
      }
      await next();
    },
    save: async (ctx: any, next: () => Promise<void>) => {
      const { values } = ctx.action.params;
      const { return: returnType = 'uid', includeAsyncNode = false } = ctx.action.params as any;
      const repository = ctx.db.getCollection('flowModels').repository as FlowModelRepository;
      const ok = await runFlowModelAction(ctx, async () => {
        if (returnType && returnType !== 'model' && returnType !== 'uid') {
          ctx.throw(400, `Invalid query param 'return': ${returnType}`, {
            code: 'INVALID_PARAMS',
          });
        }
        const normalizedValues = await validationFacade.assertValidFlowModelSchemaForSave(values, repository);
        const uid = await repository.upsertModel(normalizedValues, { transaction: ctx.transaction });
        if (returnType === 'model') {
          ctx.body = await repository.findModelById(uid, { includeAsyncNode, transaction: ctx.transaction });
        } else {
          ctx.body = uid;
        }
      });
      if (!ok) {
        return;
      }
      await next();
    },
    ensure: async (ctx: any, next: () => Promise<void>) => {
      const { includeAsyncNode = false } = ctx.action.params as any;
      const { values } = ctx.action.params as any;
      const repository = ctx.db.getCollection('flowModels').repository as FlowModelRepository;
      const ok = await runFlowModelAction(ctx, async () => {
        const normalizedValues = await validationFacade.prepareEnsureValues(values, repository, {
          transaction: ctx.transaction,
        });
        ctx.body = await repository.ensureModel(normalizedValues, {
          includeAsyncNode,
          transaction: ctx.transaction,
        });
      });
      if (!ok) {
        return;
      }
      await next();
    },
    mutate: async (ctx: any, next: () => Promise<void>) => {
      const { includeAsyncNode = false } = ctx.action.params as any;
      const repository = ctx.db.getCollection('flowModels').repository as FlowModelRepository;
      await executeFlowModelsMutate({
        ctx,
        repository,
        validationFacade,
        includeAsyncNode,
      });
      await next();
    },
    destroy: async (ctx: any, next: () => Promise<void>) => {
      const { filterByTk } = ctx.action.params;
      const repository = ctx.db.getCollection('flowModels').repository as FlowModelRepository;
      await repository.remove(filterByTk, { transaction: ctx.transaction });
      ctx.body = 'ok';
      await next();
    },
  };
}
