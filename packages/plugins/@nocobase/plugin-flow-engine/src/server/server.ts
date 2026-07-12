/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context } from '@nocobase/actions';
import { MagicAttributeModel } from '@nocobase/database';
import type { Transaction } from '@nocobase/database';
import { Plugin } from '@nocobase/server';
import { tval, uid } from '@nocobase/utils';
import path, { resolve } from 'path';
import { uiSchemaActions } from './actions/ui-schema-action';
import {
  markLightExtensionReferencesOwnerMissingForNodeTree,
  syncLightExtensionReferencesForNodeTree,
} from './flow-surfaces/light-extension-reference-integration';
import { FlowSchemaModel } from './model';
import FlowModelRepository from './repository';

type LightExtensionReferenceActionContext = {
  request?: {
    headers?: Record<string, string | string[] | undefined>;
    header?: Record<string, string | string[] | undefined>;
  };
  can?: (input: { resource: string; action: string }) => unknown | Promise<unknown>;
  auth?: {
    user?: unknown;
  };
  state?: Record<string, unknown>;
  timezone?: string;
};

export const compile = (title: string) => (title || '').replace(/{{\s*t\(["|'|`](.*)["|'|`]\)\s*}}/g, '$1');

function extractFields(obj) {
  const fields = [
    obj.title,
    obj.description,
    obj['x-component-props']?.title,
    obj['x-component-props']?.description,
    obj['x-decorator-props']?.title,
    obj['x-decorator-props']?.description,
  ];

  const content = obj['x-component-props']?.content;
  if (typeof content === 'string') {
    const regex = /\{\{\s*t\s+['"]([^'"]+)['"]\s*\}\}/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      fields.push(match[1]); // 提取 xxx
    }
  }

  return fields.filter((value) => value !== undefined && value !== '');
}

export class PluginUISchemaStorageServer extends Plugin {
  registerRepository() {
    this.app.db.registerRepositories({
      FlowModelRepository,
    });
  }

  async beforeLoad() {
    const db = this.app.db;

    this.app.db.registerModels({ MagicAttributeModel, FlowSchemaModel });

    this.registerRepository();

    this.app.acl.registerSnippet({
      name: 'ui.flowModels',
      actions: ['flowModels:*'],
    });

    db.on('flowModels.beforeCreate', function setUid(model) {
      if (!model.get('name')) {
        model.set('name', uid());
      }
    });

    this.app.localeManager.registerSource('flow-models', {
      title: tval('Flow models'),
      collections: [
        {
          collection: 'flowModels',
          getTexts: (model) =>
            extractFields(model.toJSON())
              .map((field) => compile(field))
              .filter(Boolean)
              .map((text) => ({ text, module: `resources.ui-schema-storage` })),
        },
      ],
    });

    db.on('flowModels.afterCreate', async function insertSchema(model, options) {
      const { transaction } = options;
      const uiSchemaRepository = db.getCollection('flowModels').repository as FlowModelRepository;

      const context = options.context;

      if (context?.disableInsertHook) {
        return;
      }

      await uiSchemaRepository.insert(model.toJSON(), {
        transaction,
      });
    });

    db.on('flowModels.afterUpdate', async function patchSchema(model, options) {
      const { transaction } = options;
      const uiSchemaRepository = db.getCollection('flowModels').repository as FlowModelRepository;

      await uiSchemaRepository.patch(model.toJSON(), {
        transaction,
      });
    });

    db.on('flowModels.afterDestroy', async function patchSchema(model, options) {
      const { transaction } = options;
      const uiSchemaRepository = db.getCollection('flowModels').repository as FlowModelRepository;

      await uiSchemaRepository.remove(model.get('name'), { transaction });
    });

    db.on('flowModels.beforeRemoveTree', async (payload, options) => {
      await markLightExtensionReferencesOwnerMissingForNodeTree(
        this,
        {
          rootUid: payload?.rootUid,
          action: 'flowModels.repository.remove',
        },
        {
          transaction: options?.transaction,
          requestSource: 'flowModels.beforeRemoveTree',
        },
      );
    });

    this.app.resourceManager.define({
      name: 'flowModels',
      actions: {
        findOne: async (ctx, next) => {
          const { uid, parentId, subKey, includeAsyncNode = false } = ctx.action.params;
          const repository = ctx.db.getRepository('flowModels') as FlowModelRepository;
          if (uid) {
            ctx.body = await repository.findModelById(uid, { includeAsyncNode });
          } else if (parentId) {
            ctx.body = await repository.findModelByParentId(parentId, { subKey, includeAsyncNode });
          }
          await next();
        },
        duplicate: async (ctx, next) => {
          const { uid } = ctx.action.params;
          const repository = ctx.db.getRepository('flowModels') as FlowModelRepository;
          const duplicated = await ctx.db.sequelize.transaction(async (transaction) => {
            const duplicated = await repository.duplicate(uid, { transaction });
            await syncLightExtensionReferencesForNodeTree(
              this,
              {
                rootUid: duplicated?.uid,
                action: 'flowModels.duplicate',
              },
              getLightExtensionReferenceContext(ctx, transaction),
            );
            return duplicated;
          });
          ctx.body = duplicated;
          await next();
        },
        attach: async (ctx, next) => {
          const { uid, parentId, subKey, subType, position } = ctx.action.params;
          const repository = ctx.db.getRepository('flowModels') as FlowModelRepository;
          const attached = await repository.attach(String(uid || '').trim(), {
            parentId: String(parentId || '').trim(),
            subKey: String(subKey || '').trim(),
            subType,
            position,
          });
          ctx.body = attached;
          await next();
        },
        move: async (ctx, next) => {
          const { sourceId, targetId, position } = ctx.action.params;
          const repository = ctx.db.getRepository('flowModels') as FlowModelRepository;
          await repository.move({ sourceId, targetId, position });
          ctx.body = 'ok';
          await next();
        },
        save: async (ctx, next) => {
          const { values } = ctx.action.params;
          const repository = ctx.db.getRepository('flowModels') as FlowModelRepository;
          const uid = await ctx.db.sequelize.transaction(async (transaction) => {
            const uid = await repository.upsertModel(values, { transaction });
            await syncLightExtensionReferencesForNodeTree(
              this,
              {
                rootUid: uid,
                action: 'flowModels.save',
              },
              getLightExtensionReferenceContext(ctx, transaction),
            );
            return uid;
          });
          ctx.body = uid;
          // ctx.body = await repository.findModelById(uid);
          await next();
        },
        destroy: async (ctx, next) => {
          const { filterByTk } = ctx.action.params;
          const repository = ctx.db.getRepository('flowModels') as FlowModelRepository;
          await repository.remove(filterByTk);
          ctx.body = 'ok';
          await next();
        },
      },
    });

    this.app.acl.allow('flowModels', ['findOne'], 'loggedIn');
  }

  async load() {
    const getSourceAndTargetForRemoveAction = async (ctx: Context) => {
      const { filterByTk } = ctx.action.params;
      return {
        targetCollection: 'flowModels',
        targetRecordUK: filterByTk,
      };
    };

    const getSourceAndTargetForInsertAdjacentAction = async (ctx: Context) => {
      const body = toRecord(ctx.request.body);
      const options = toRecord(body.options);
      return {
        targetCollection: 'flowModels',
        targetRecordUK: options.uid,
      };
    };

    const getSourceAndTargetForPatchAction = async (ctx: Context) => {
      const body = toRecord(ctx.request.body);
      return {
        targetCollection: 'flowModels',
        targetRecordUK: body.uid,
      };
    };
    this.app.auditManager.registerActions([
      { name: 'flowModels:remove', getSourceAndTarget: getSourceAndTargetForRemoveAction },
      { name: 'flowModels:insertAdjacent', getSourceAndTarget: getSourceAndTargetForInsertAdjacentAction },
      { name: 'flowModels:patch', getSourceAndTarget: getSourceAndTargetForPatchAction },
    ]);
  }
}

function getLightExtensionReferenceContext(ctx: unknown, transaction?: Transaction) {
  const actionCtx: LightExtensionReferenceActionContext =
    ctx && typeof ctx === 'object' ? (ctx as LightExtensionReferenceActionContext) : {};
  const headers = actionCtx.request?.headers || actionCtx.request?.header || {};
  return {
    can: actionCtx.can,
    actorUserId: getCurrentUserId(actionCtx),
    requestId: getHeader(headers, 'x-request-id') || getHeader(headers, 'x-correlation-id'),
    requestSource: getHeader(headers, 'x-request-source') || 'flowModels',
    currentUser: actionCtx.auth?.user,
    state: actionCtx.state,
    timezone: actionCtx.timezone,
    transaction,
  };
}

function getCurrentUserId(ctx: LightExtensionReferenceActionContext): string | null {
  const user = ctx.auth?.user;
  if (!user || typeof user !== 'object') {
    return null;
  }
  const userRecord = user as { id?: unknown; get?: (key: string) => unknown };
  if (typeof userRecord.id === 'string' || typeof userRecord.id === 'number') {
    return String(userRecord.id);
  }
  if (typeof userRecord.get === 'function') {
    const id = userRecord.get('id');
    return typeof id === 'string' || typeof id === 'number' ? String(id) : null;
  }
  return null;
}

function getHeader(headers: Record<string, string | string[] | undefined>, name: string): string | undefined {
  const value = headers[name] || headers[name.toLowerCase()];
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

export default PluginUISchemaStorageServer;
