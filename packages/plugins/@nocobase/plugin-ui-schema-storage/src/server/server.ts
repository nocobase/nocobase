/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MagicAttributeModel } from '@nocobase/database';
import { Plugin } from '@nocobase/server';
import { uid } from '@nocobase/utils';
import path, { resolve } from 'path';
import { uiSchemaActions } from './actions/ui-schema-action';
import { UiSchemaModel } from './model';
import UiSchemaRepository from './repository';
import { ServerHooks } from './server-hooks';
import { ServerHookModel } from './server-hooks/model';

export class PluginUISchemaStorageServer extends Plugin {
  serverHooks: ServerHooks;

  registerRepository() {
    this.app.db.registerRepositories({
      UiSchemaRepository,
    });
  }

  async beforeLoad() {
    const db = this.app.db;

    this.serverHooks = new ServerHooks(db);

    this.app.db.registerModels({ MagicAttributeModel, UiSchemaModel, ServerHookModel });

    this.registerRepository();

    this.app.acl.registerSnippet({
      name: `pm.${this.name}.block-templates`,
      actions: ['uiSchemaTemplates:*'],
    });

    this.app.acl.registerSnippet({
      name: 'ui.uiSchemas',
      actions: ['uiSchemas:*', 'uiSchemas.roles:list', 'uiSchemas.roles:set'],
    });

    db.on('uiSchemas.beforeCreate', function setUid(model) {
      if (!model.get('name')) {
        model.set('name', uid());
      }
    });

    db.on('uiSchemas.afterCreate', async function insertSchema(model, options) {
      const { transaction } = options;
      const uiSchemaRepository = db.getCollection('uiSchemas').repository as UiSchemaRepository;

      const context = options.context;

      if (context?.disableInsertHook) {
        return;
      }

      await uiSchemaRepository.insert(model.toJSON(), {
        transaction,
      });
    });

    db.on('uiSchemas.afterUpdate', async function patchSchema(model, options) {
      const { transaction } = options;
      const uiSchemaRepository = db.getCollection('uiSchemas').repository as UiSchemaRepository;

      await uiSchemaRepository.patch(model.toJSON(), {
        transaction,
      });
    });

    this.app.resourcer.define({
      name: 'uiSchemas',
      actions: uiSchemaActions,
    });

    this.app.acl.allow(
      'uiSchemas',
      ['getProperties', 'getJsonSchema', 'getParentJsonSchema', 'initializeActionContext'],
      'loggedIn',
    );
    this.app.acl.allow('uiSchemaTemplates', ['get', 'list'], 'loggedIn');
  }

  async load() {
    this.db.addMigrations({
      namespace: 'ui-schema-storage',
      directory: path.resolve(__dirname, './migrations'),
      context: {
        plugin: this,
      },
    });

    const getSourceAndTargetForRemoveAction = async (ctx: any) => {
      const { filterByTk } = ctx.action.params;
      return {
        targetCollection: 'uiSchemas',
        targetRecordUK: filterByTk,
      };
    };

    const getSourceAndTargetForInsertAdjacentAction = async (ctx: any) => {
      return {
        targetCollection: 'uiSchemas',
        targetRecordUK: ctx.request.body?.schema?.['x-uid'],
      };
    };

    const getSourceAndTargetForPatchAction = async (ctx: any) => {
      return {
        targetCollection: 'uiSchemas',
        targetRecordUK: ctx.request.body?.['x-uid'],
      };
    };
    this.app.auditManager.registerActions([
      { name: 'uiSchemas:remove', getSourceAndTarget: getSourceAndTargetForRemoveAction },
      { name: 'uiSchemas:insertAdjacent', getSourceAndTarget: getSourceAndTargetForInsertAdjacentAction },
      { name: 'uiSchemas:patch', getSourceAndTarget: getSourceAndTargetForPatchAction },
    ]);

    await this.importCollections(resolve(__dirname, 'collections'));
  }
}

export default PluginUISchemaStorageServer;
