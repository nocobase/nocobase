/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { UiSchemaRepository } from '@nocobase/plugin-ui-schema-storage';
import { Plugin } from '@nocobase/server';
import { parseAssociationNames } from './hook';

class PasswordError extends Error {}

export class PluginPublicFormsServer extends Plugin {
  async parseCollectionData(dataSourceKey, formCollection, appends) {
    const dataSource = this.app.dataSourceManager.dataSources.get(dataSourceKey);
    const collection = dataSource.collectionManager.getCollection(formCollection);
    const collections = [
      {
        name: collection.name,
        fields: collection.getFields().map((v) => {
          return {
            ...v.options,
          };
        }),
        template: collection.options.template,
      },
    ];
    return collections.concat(
      appends.map((v) => {
        const targetCollection = this.db.getCollection(v);
        return {
          name: targetCollection.name,
          fields: targetCollection.getFields().map((v) => {
            return {
              ...v.options,
            };
          }),
          template: targetCollection.options.template,
        };
      }),
    );
  }

  async getMetaByTk(filterByTk: string, options: { password?: string; token?: string }) {
    const { token, password } = options;
    const publicForms = this.db.getRepository('publicForms');
    const uiSchema = this.db.getRepository<UiSchemaRepository>('uiSchemas');
    const instance = await publicForms.findOne({
      filter: {
        key: filterByTk,
      },
    });
    if (!instance) {
      throw new Error('The form is not found');
    }
    if (!instance.get('enabled')) {
      return null;
    }
    if (!token) {
      if (instance.get('password')) {
        if (password === undefined) {
          return {
            passwordRequired: true,
          };
        }
        if (this.app.environment.renderJsonTemplate(instance.get('password')) !== password) {
          throw new PasswordError('Please enter your password');
        }
      }
    }
    const keys = instance.collection.split(':');
    const collectionName = keys.pop();
    const dataSourceKey = keys.pop() || 'main';
    const title = instance.get('title');
    const schema = await uiSchema.getJsonSchema(filterByTk);
    const { getAssociationAppends } = parseAssociationNames(dataSourceKey, collectionName, this.app, schema);
    const { appends } = getAssociationAppends();
    const collections = await this.parseCollectionData(dataSourceKey, collectionName, appends);
    return {
      dataSource: {
        key: dataSourceKey,
        displayName: dataSourceKey,
        collections,
      },
      token: this.app.authManager.jwt.sign(
        {
          collectionName,
          formKey: filterByTk,
          targetCollections: appends,
        },
        {
          expiresIn: '1h',
        },
      ),
      schema,
      title,
    };
  }

  // TODO
  getPublicFormsMeta = async (ctx, next) => {
    const token = ctx.get('X-Form-Token');
    const { filterByTk, password } = ctx.action.params;
    try {
      ctx.body = await this.getMetaByTk(filterByTk, { password, token });
    } catch (error) {
      if (error instanceof PasswordError) {
        ctx.throw(401, error.message);
      } else {
        throw error;
      }
    }
    await next();
  };

  parseToken = async (ctx, next) => {
    if (!ctx.action) {
      return next();
    }
    const { actionName, resourceName, params } = ctx.action;
    // 有密码时，跳过 token
    if (resourceName === 'publicForms' && actionName === 'getMeta' && params.password) {
      return next();
    }
    const jwt = this.app.authManager.jwt;
    const token = ctx.get('X-Form-Token');
    if (token) {
      try {
        const tokenData = await jwt.decode(token);
        ctx.PublicForm = {
          collectionName: tokenData.collectionName,
          formKey: tokenData.formKey,
          targetCollections: tokenData.targetCollections,
        };

        const publicForms = this.db.getRepository('publicForms');
        const instance = await publicForms.findOne({
          filter: {
            key: tokenData.formKey,
          },
        });
        if (!instance) {
          throw new Error('The form is not found');
        }
        if (!instance.get('enabled')) {
          throw new Error('The form is not enabled');
        }
        // 将 publicSubmit 转为 create（用于触发工作流的 Action 事件）
        const actionName = ctx.action.actionName;
        if (actionName === 'publicSubmit') {
          ctx.action.actionName = 'create';
        }
        ctx.skipAuthCheck = true;
      } catch (error) {
        ctx.throw(401, error.message);
      }
    }
    await next();
  };

  parseACL = async (ctx, next) => {
    if (!ctx.PublicForm) {
      return next();
    }
    const { resourceName, actionName } = ctx.action;
    const collection = this.db.getCollection(resourceName);
    if (actionName === 'create' && ctx.PublicForm['collectionName'] === resourceName) {
      ctx.permission = {
        skip: true,
      };
    } else if (
      (['list', 'get'].includes(actionName) && ctx.PublicForm['targetCollections'].includes(resourceName)) ||
      (collection?.options.template === 'file' && actionName === 'create') ||
      (resourceName === 'storages' && ['getBasicInfo', 'createPresignedUrl'].includes(actionName)) ||
      (resourceName === 'vditor' && ['check'].includes(actionName)) ||
      (resourceName === 'map-configuration' && actionName === 'get')
    ) {
      ctx.permission = {
        skip: true,
      };
    }
    await next();
  };

  async load() {
    this.app.acl.registerSnippet({
      name: `pm.${this.name}`,
      actions: ['publicForms:*'],
    });

    this.app.acl.allow('publicForms', 'getMeta', 'public');
    this.app.resourceManager.registerActionHandlers({
      'publicForms:getMeta': this.getPublicFormsMeta,
    });
    this.app.dataSourceManager.afterAddDataSource((dataSource) => {
      dataSource.resourceManager.use(this.parseToken, {
        before: 'auth',
      });
      dataSource.acl.use(this.parseACL, {
        before: 'core',
      });
      dataSource.resourceManager.registerActionHandlers({
        publicSubmit: dataSource.resourceManager.getRegisteredHandler('create'),
      });
    });
  }

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginPublicFormsServer;
