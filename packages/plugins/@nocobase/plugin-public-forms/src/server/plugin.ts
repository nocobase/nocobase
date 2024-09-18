/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PasswordField } from '@nocobase/database';
import { UiSchemaRepository } from '@nocobase/plugin-ui-schema-storage';
import { Plugin } from '@nocobase/server';
import { parseAssociationNames } from './hook';

class PasswordError extends Error {}

export class PluginPublicFormsServer extends Plugin {
  async parseCollectionData(formCollection, appends) {
    const collection = this.db.getCollection(formCollection);
    const collections = [
      {
        name: collection.name,
        fields: collection.getFields().map((v) => {
          return {
            ...v.options,
          };
        }),
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
        };
      }),
    );
  }
  // TODO
  async getMetaByTk(filterByTk: string, options: { password?: string; token?: string }) {
    const { token, password } = options;
    const publicForms = this.db.getRepository('publicForms');
    const uiSchema = this.db.getRepository<UiSchemaRepository>('uiSchemas');
    const instance = await publicForms.findOne({
      filter: {
        key: filterByTk,
      },
    });
    if (!instance.get('enabled')) {
      return null;
    }
    if (!token) {
      if (instance.get('password') && instance.get('enabledPassword')) {
        const Password = publicForms.collection.getField<PasswordField>('password');
        const r = await Password.verify(password, instance.get('password'));
        if (!r) {
          throw new PasswordError('Please enter your password');
        }
      }
    }
    const keys = instance.collection.split('.');
    const collectionName = keys.pop();
    const dataSourceKey = keys.pop() || 'main';
    const schema = await uiSchema.getJsonSchema(filterByTk);
    const { getAssociationAppends } = parseAssociationNames(dataSourceKey, collectionName, this.app, schema);
    const { appends } = getAssociationAppends();
    const collections = await this.parseCollectionData(collectionName, appends);
    return {
      dataSource: {
        key: dataSourceKey,
        displayName: dataSourceKey,
        collections,
      },
      token: this.app.authManager.jwt.sign({
        collectionName,
        formKey: filterByTk,
        targetCollections: appends,
      }),
      schema,
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

  // TODO
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
        // TODO：decode token
        ctx.PublicForm = {
          collectionName: tokenData.collectionName,
          formKey: tokenData.formKey,
          targetCollections: tokenData.targetCollections,
        };
        // 将 publicSubmit 转为 create（用于触发工作流的 Action 事件）
        const actionName = ctx.action.actionName;
        if (actionName === 'publicSubmit') {
          ctx.action.actionName = 'create';
        }
      } catch (error) {
        ctx.throw(401, error.message);
      }
    }
    await next();
  };

  // TODO：用于处理哪些可选项的接口可以访问
  parseACL = async (ctx, next) => {
    const { resourceName, actionName } = ctx.action;
    if (ctx.PublicForm && ['create', 'list'].includes(actionName)) {
      if (actionName === 'create') {
        ctx.permission = {
          skip: ctx.PublicForm['collectionName'] === resourceName,
        };
      } else {
        ctx.permission = {
          skip: ctx.PublicForm['targetCollections'].includes(resourceName),
        };
      }
    } else {
      ctx.permission = {
        skip: true,
      };
    }

    await next();
  };

  async load() {
    this.app.acl.allow('publicForms', 'getMeta', 'public');
    this.app.resourceManager.registerActionHandlers({
      'publicForms:getMeta': this.getPublicFormsMeta,
    });
    this.app.dataSourceManager.afterAddDataSource((dataSource) => {
      dataSource.resourceManager.use(this.parseToken, {
        before: 'acl',
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
