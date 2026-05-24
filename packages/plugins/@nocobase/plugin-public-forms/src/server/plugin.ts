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
import { fillParentFields, parseAssociationNames } from './hook';

class PasswordError extends Error {}

export class PluginPublicFormsServer extends Plugin {
  protected associationFieldTypes = ['hasOne', 'hasMany', 'belongsTo', 'belongsToMany', 'belongsToArray'];

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
        const targetCollection = dataSource.collectionManager.getCollection(v);
        return {
          ...targetCollection.options,
          fields: targetCollection.getFields().map((v) => {
            return {
              ...v.options,
            };
          }),
        };
      }),
    );
  }

  async getFlowModelTree(uid: string) {
    const repository = this.db.getCollection('flowModels')?.repository as any;

    if (!repository?.findModelById) {
      return null;
    }

    return repository.findModelById(uid, { includeAsyncNode: true }).catch(() => null);
  }

  getSchemaAssociationAppends(dataSourceKey: string, collectionName: string, schema: any) {
    if (!schema?.properties?.form) {
      return [];
    }

    const { getAssociationAppends } = parseAssociationNames(dataSourceKey, collectionName, this.app, schema);
    return getAssociationAppends().appends || [];
  }

  getFlowModelAssociationAppends(dataSourceKey: string, collectionName: string, flowModel: any) {
    const dataSource = this.app.dataSourceManager.dataSources.get(dataSourceKey);
    const appends = new Set<string>();

    const traverse = (node: any) => {
      if (!node || typeof node !== 'object') {
        return;
      }

      const init = node.stepParams?.fieldSettings?.init;
      const fieldDataSourceKey = init?.dataSourceKey || dataSourceKey;
      const fieldCollectionName = init?.collectionName || collectionName;
      const fieldPath = init?.fieldPath;

      if (fieldDataSourceKey === dataSourceKey && fieldCollectionName && fieldPath) {
        const collection = dataSource.collectionManager.getCollection(fieldCollectionName);
        const fieldName = String(fieldPath).split('.')[0];
        const collectionField = collection?.getField(fieldName);

        if (collectionField && this.associationFieldTypes.includes(collectionField.type) && collectionField.target) {
          appends.add(collectionField.target);
        }
      }

      Object.values(node.subModels || {}).forEach((subModel: any) => {
        if (Array.isArray(subModel)) {
          subModel.forEach(traverse);
          return;
        }
        traverse(subModel);
      });
    };

    traverse(flowModel);

    return [...fillParentFields(appends)];
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
    const [schema, flowModel] = await Promise.all([
      uiSchema.getJsonSchema(filterByTk).catch(() => null),
      this.getFlowModelTree(filterByTk),
    ]);
    const appends = [
      ...new Set([
        ...this.getSchemaAssociationAppends(dataSourceKey, collectionName, schema),
        ...this.getFlowModelAssociationAppends(dataSourceKey, collectionName, flowModel),
      ]),
    ];
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
      flowModel,
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
