/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MagicAttributeModel } from '@nocobase/database';
import PluginLocalizationServer from '@nocobase/plugin-localization';
import { Plugin } from '@nocobase/server';
import { tval, uid } from '@nocobase/utils';
import path, { resolve } from 'path';
import { uiSchemaActions } from './actions/ui-schema-action';
import { FlowSchemaModel } from './model';
import FlowModelRepository from './repository';

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
    const pm = this.app.pm;

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

    db.on('flowModels.afterSave', async function setUid(model, options) {
      const localizationPlugin = pm.get('localization') as PluginLocalizationServer;
      const texts = [];
      const changedFields = extractFields(model.toJSON());
      if (!changedFields.length) {
        return;
      }
      changedFields.forEach((field) => {
        field && texts.push({ text: compile(field), module: `resources.ui-schema-storage` });
      });
      await localizationPlugin?.addNewTexts?.(texts, options);
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
          const duplicated = await repository.duplicate(uid);
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
          const uid = await repository.upsertModel(values);
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
    const getSourceAndTargetForRemoveAction = async (ctx: any) => {
      const { filterByTk } = ctx.action.params;
      return {
        targetCollection: 'flowModels',
        targetRecordUK: filterByTk,
      };
    };

    const getSourceAndTargetForInsertAdjacentAction = async (ctx: any) => {
      return {
        targetCollection: 'flowModels',
        targetRecordUK: ctx.request.body?.options?.['uid'],
      };
    };

    const getSourceAndTargetForPatchAction = async (ctx: any) => {
      return {
        targetCollection: 'flowModels',
        targetRecordUK: ctx.request.body?.['uid'],
      };
    };
    this.app.auditManager.registerActions([
      { name: 'flowModels:remove', getSourceAndTarget: getSourceAndTargetForRemoveAction },
      { name: 'flowModels:insertAdjacent', getSourceAndTarget: getSourceAndTargetForInsertAdjacentAction },
      { name: 'flowModels:patch', getSourceAndTarget: getSourceAndTargetForPatchAction },
    ]);
  }
}

export default PluginUISchemaStorageServer;
