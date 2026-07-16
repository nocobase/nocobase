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
import { getAuthCookieOptions } from '@nocobase/utils';
import crypto from 'crypto';
import { fillParentFields, parseAssociationNames } from './hook';

class PasswordError extends Error {}

const PUBLIC_FORM_COOKIE_PREFIX = 'nb_pf_';
const PUBLIC_FORM_TOKEN_EXPIRES_IN = '1h';
const PUBLIC_FORM_COOKIE_MAX_AGE = 60 * 60 * 1000;

type PublicFormTokenPayload = {
  collectionName: string;
  formKey: string;
  targetCollections: string[];
  exp?: number;
};

type PublicFormCookiePayload = PublicFormTokenPayload & {
  v: 1;
  appName?: string;
  files: Record<string, Array<string | number>>;
};

type FileAccessAuthorizeParams = {
  appName: string;
  dataSourceKey: string;
  collectionName: string;
  id: string;
  preview: boolean;
};

type FileAccessAuthorizerPlugin = {
  registerFileAccessAuthorizer?: (authorizer: {
    name: string;
    authorize: (ctx, params: FileAccessAuthorizeParams) => Promise<boolean>;
  }) => void;
};

function parseCookieHeader(header: string | undefined) {
  const cookies: Array<[string, string]> = [];
  if (!header) {
    return cookies;
  }

  for (const item of header.split(';')) {
    const index = item.indexOf('=');
    if (index < 0) {
      continue;
    }
    const name = item.slice(0, index).trim();
    const value = item.slice(index + 1).trim();
    if (!name) {
      continue;
    }
    try {
      cookies.push([name, decodeURIComponent(value)]);
    } catch {
      cookies.push([name, value]);
    }
  }

  return cookies;
}

function normalizeFiles(value: unknown) {
  const files: Record<string, Array<string | number>> = {};
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return files;
  }

  for (const [key, ids] of Object.entries(value)) {
    if (typeof key !== 'string' || !Array.isArray(ids)) {
      continue;
    }
    files[key] = ids.filter((id): id is string | number => typeof id === 'string' || typeof id === 'number');
  }

  return files;
}

function getResponseRecordId(body: unknown) {
  const responseBody = body && typeof body === 'object' && 'data' in body ? body.data : body;
  if (!responseBody || typeof responseBody !== 'object') {
    return null;
  }
  if ('get' in responseBody && typeof responseBody.get === 'function') {
    return responseBody.get('id');
  }
  if ('id' in responseBody) {
    return responseBody.id;
  }
  return null;
}

export class PluginPublicFormsServer extends Plugin {
  protected associationFieldTypes = ['hasOne', 'hasMany', 'belongsTo', 'belongsToMany', 'belongsToArray'];
  protected fileAccessAuthorizerRegistered = false;

  async parseCollectionData(dataSourceKey, formCollection, appends) {
    const dataSource = this.app.dataSourceManager.dataSources.get(dataSourceKey);
    const serializeCollection = (collection) => ({
      ...collection.options,
      name: collection.name,
      filterTargetKey: collection.filterTargetKey,
      titleField: collection.titleField,
      fields: collection.getFields().map((v) => {
        return {
          ...v.options,
        };
      }),
    });
    const collection = dataSource.collectionManager.getCollection(formCollection);
    const collections = [serializeCollection(collection)];
    return collections.concat(
      appends.map((v) => {
        const targetCollection = dataSource.collectionManager.getCollection(v);
        return serializeCollection(targetCollection);
      }),
    );
  }

  async getFlowModelTree(uid: string, options: { includeAsyncNode?: boolean } = {}) {
    const repository = this.db.getCollection('flowModels')?.repository as any;

    if (!repository?.findModelById) {
      return null;
    }

    return repository.findModelById(uid, { includeAsyncNode: !!options.includeAsyncNode }).catch(() => null);
  }
  async isFlowModelDescendant(rootUid: string, uid: string) {
    if (!rootUid || !uid) {
      return false;
    }

    if (rootUid === uid) {
      return true;
    }

    const repository = this.db.getRepository('flowModelTreePath') as any;
    const node = await repository?.model?.findOne?.({
      where: {
        ancestor: rootUid,
        descendant: uid,
      },
    });
    return !!node;
  }

  async validatePublicFormToken(filterByTk: string, token?: string) {
    if (!token) {
      throw new Error('Public form token is required');
    }

    const tokenData = await this.app.authManager.jwt.decode(token);
    if (tokenData?.formKey !== filterByTk) {
      throw new Error('Invalid public form token');
    }

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

    return tokenData;
  }

  async getFlowModelByTk(
    filterByTk: string,
    options: {
      uid?: string;
      parentId?: string;
      subKey?: string;
      token?: string;
    },
  ) {
    await this.validatePublicFormToken(filterByTk, options.token);

    const repository = this.db.getCollection('flowModels')?.repository as any;
    if (!repository) {
      return null;
    }

    if (options.uid) {
      if (!(await this.isFlowModelDescendant(filterByTk, options.uid))) {
        throw new Error('The flow model is not in this public form');
      }
      return repository.findModelById(options.uid, { includeAsyncNode: true }).catch(() => null);
    }

    if (!options.parentId) {
      throw new Error('parentId is required');
    }

    if (!(await this.isFlowModelDescendant(filterByTk, options.parentId))) {
      throw new Error('The flow model parent is not in this public form');
    }

    const flowModel = await repository
      .findModelByParentId(options.parentId, {
        subKey: options.subKey,
        includeAsyncNode: true,
      })
      .catch(() => null);

    if (flowModel?.uid && !(await this.isFlowModelDescendant(filterByTk, flowModel.uid))) {
      throw new Error('The flow model is not in this public form');
    }

    return flowModel;
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
        const collectionFieldOptions = collectionField?.options;

        if (
          collectionFieldOptions &&
          this.associationFieldTypes.includes(collectionFieldOptions.type) &&
          collectionFieldOptions.target
        ) {
          appends.add(collectionFieldOptions.target);
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
    if (instance.get('password')) {
      if (password !== undefined) {
        if (this.app.environment.renderJsonTemplate(instance.get('password')) !== password) {
          throw new PasswordError('Please enter your password');
        }
      } else if (token) {
        try {
          await this.validatePublicFormToken(filterByTk, token);
        } catch (error) {
          return {
            passwordRequired: true,
          };
        }
      } else {
        return {
          passwordRequired: true,
        };
      }
    }
    const keys = instance.collection.split(':');
    const collectionName = keys.pop();
    const dataSourceKey = keys.pop() || 'main';
    const title = instance.get('title');
    const [schema, flowModel, completeFlowModel] = await Promise.all([
      uiSchema.getJsonSchema(filterByTk).catch(() => null),
      this.getFlowModelTree(filterByTk),
      this.getFlowModelTree(filterByTk, { includeAsyncNode: true }),
    ]);
    const appends = [
      ...new Set([
        ...this.getSchemaAssociationAppends(dataSourceKey, collectionName, schema),
        ...this.getFlowModelAssociationAppends(dataSourceKey, collectionName, completeFlowModel || flowModel),
      ]),
    ];
    const collections = await this.parseCollectionData(dataSourceKey, collectionName, appends);
    const tokenPayload: PublicFormTokenPayload = {
      collectionName,
      formKey: filterByTk,
      targetCollections: appends,
    };
    return {
      dataSource: {
        key: dataSourceKey,
        displayName: dataSourceKey,
        collections,
      },
      token: this.app.authManager.jwt.sign(tokenPayload, {
        expiresIn: PUBLIC_FORM_TOKEN_EXPIRES_IN,
      }),
      schema,
      flowModel,
      title,
    };
  }

  getPublicFormCookieName(formKey: string) {
    const appName = this.app.name || 'main';
    const hash = crypto.createHash('sha256').update(`${appName}:${formKey}`).digest('hex').slice(0, 32);
    return `${PUBLIC_FORM_COOKIE_PREFIX}${hash}`;
  }

  async decodePublicFormCookie(value?: string | null): Promise<PublicFormCookiePayload | null> {
    if (!value) {
      return null;
    }
    const decoded = await this.app.authManager.jwt.decode(value);
    if (
      decoded?.v !== 1 ||
      typeof decoded.formKey !== 'string' ||
      typeof decoded.collectionName !== 'string' ||
      !Array.isArray(decoded.targetCollections)
    ) {
      return null;
    }
    return {
      v: 1,
      appName: typeof decoded.appName === 'string' ? decoded.appName : undefined,
      formKey: decoded.formKey,
      collectionName: decoded.collectionName,
      targetCollections: decoded.targetCollections.filter((name) => typeof name === 'string'),
      files: normalizeFiles(decoded.files),
      exp: typeof decoded.exp === 'number' ? decoded.exp : undefined,
    };
  }

  async readPublicFormCookie(ctx, formKey: string) {
    try {
      return await this.decodePublicFormCookie(ctx.cookies?.get(this.getPublicFormCookieName(formKey)));
    } catch {
      return null;
    }
  }

  setPublicFormCookie(ctx, payload: PublicFormCookiePayload, maxAge = PUBLIC_FORM_COOKIE_MAX_AGE) {
    ctx.cookies?.set(
      this.getPublicFormCookieName(payload.formKey),
      this.app.authManager.jwt.sign(
        {
          v: 1,
          appName: this.app.name || 'main',
          formKey: payload.formKey,
          collectionName: payload.collectionName,
          targetCollections: payload.targetCollections,
          files: normalizeFiles(payload.files),
        },
        { expiresIn: Math.max(1, Math.floor(maxAge / 1000)) },
      ),
      getAuthCookieOptions(ctx, true, maxAge),
    );
  }

  // TODO
  getPublicFormsMeta = async (ctx, next) => {
    const token = ctx.get('X-Form-Token');
    const { filterByTk, password } = ctx.action.params;
    try {
      const existingCookie = password === undefined ? await this.readPublicFormCookie(ctx, filterByTk) : null;
      ctx.body = await this.getMetaByTk(filterByTk, { password, token });
      if (ctx.body?.token && (password !== undefined || !existingCookie)) {
        const tokenPayload = (await this.app.authManager.jwt.decode(ctx.body.token)) as PublicFormTokenPayload;
        this.setPublicFormCookie(ctx, {
          v: 1,
          formKey: tokenPayload.formKey,
          collectionName: tokenPayload.collectionName,
          targetCollections: tokenPayload.targetCollections,
          files: existingCookie?.formKey === tokenPayload.formKey ? existingCookie.files : {},
        });
      }
    } catch (error) {
      if (error instanceof PasswordError) {
        ctx.throw(401, error.message);
      } else {
        throw error;
      }
    }
    await next();
  };

  getPublicFormFlowModel = async (ctx, next) => {
    const token = ctx.get('X-Form-Token');
    const { filterByTk, uid, parentId, subKey } = ctx.action.params;
    try {
      ctx.body = await this.getFlowModelByTk(filterByTk, { uid, parentId, subKey, token });
    } catch (error) {
      ctx.throw(401, error.message);
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
          exp: tokenData.exp,
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
      (collection?.options.template === 'file' && ['create', 'upload'].includes(actionName)) ||
      (resourceName === 'storages' && ['getBasicInfo', 'createPresignedUrl', 'check'].includes(actionName)) ||
      (resourceName === 'vditor' && ['check'].includes(actionName)) ||
      (resourceName === 'map-configuration' && actionName === 'get')
    ) {
      ctx.permission = {
        skip: true,
      };
    }
    await next();
  };

  appendUploadedFileToPublicFormCookie = async (ctx, next) => {
    await next();

    if (!ctx.PublicForm || !['create', 'upload'].includes(ctx.action?.actionName)) {
      return;
    }

    const collection =
      ctx.dataSource?.collectionManager?.getCollection(ctx.action.resourceName) ||
      ctx.db?.getCollection?.(ctx.action.resourceName);
    if (collection?.options?.template !== 'file') {
      return;
    }

    const id = getResponseRecordId(ctx.body);
    if (id === null || id === undefined || id === '') {
      return;
    }

    const formKey = ctx.PublicForm.formKey;
    const existingCookie = await this.readPublicFormCookie(ctx, formKey);
    const files = normalizeFiles(existingCookie?.files);
    const dataSourceKey = ctx.dataSource?.name || ctx.action.params?.dataSourceKey || 'main';
    const fileKey = `${dataSourceKey}/${collection.name}`;
    const ids = files[fileKey] || [];
    if (!ids.some((existingId) => String(existingId) === String(id))) {
      ids.push(id);
    }
    files[fileKey] = ids;

    const expiresAt = existingCookie?.exp || ctx.PublicForm.exp;
    const maxAge = expiresAt ? expiresAt * 1000 - Date.now() : PUBLIC_FORM_COOKIE_MAX_AGE;
    if (maxAge <= 0) {
      return;
    }

    this.setPublicFormCookie(
      ctx,
      {
        v: 1,
        formKey,
        collectionName: ctx.PublicForm.collectionName,
        targetCollections: ctx.PublicForm.targetCollections || [],
        files,
      },
      maxAge,
    );
  };

  authorizePublicFormFileAccess = async (ctx, params: FileAccessAuthorizeParams) => {
    const cookies = parseCookieHeader(ctx.get?.('cookie'));
    const fileKey = `${params.dataSourceKey}/${params.collectionName}`;

    for (const [name, value] of cookies) {
      if (!name.startsWith(PUBLIC_FORM_COOKIE_PREFIX)) {
        continue;
      }
      try {
        const payload = await this.decodePublicFormCookie(value);
        if (!payload) {
          continue;
        }
        if (payload.appName && payload.appName !== params.appName) {
          continue;
        }
        if (payload.files[fileKey]?.some((id) => String(id) === String(params.id))) {
          const instance = await this.db.getRepository('publicForms').findOne({
            filter: {
              key: payload.formKey,
            },
          });
          if (instance?.get('enabled')) {
            return true;
          }
        }
      } catch {
        continue;
      }
    }

    return false;
  };

  registerFileAccessAuthorizer() {
    if (this.fileAccessAuthorizerRegistered) {
      return;
    }
    const fileManager = (this.app.pm.get('file-manager') || this.app.pm.get('@nocobase/plugin-file-manager')) as
      | FileAccessAuthorizerPlugin
      | undefined;
    if (typeof fileManager?.registerFileAccessAuthorizer !== 'function') {
      return;
    }
    fileManager.registerFileAccessAuthorizer({
      name: 'public-forms',
      authorize: this.authorizePublicFormFileAccess,
    });
    this.fileAccessAuthorizerRegistered = true;
  }

  async load() {
    this.app.acl.registerSnippet({
      name: `pm.${this.name}`,
      actions: ['publicForms:*'],
    });

    this.app.acl.allow('publicForms', ['getMeta', 'getFlowModel'], 'public');
    this.app.resourceManager.registerActionHandlers({
      'publicForms:getMeta': this.getPublicFormsMeta,
      'publicForms:getFlowModel': this.getPublicFormFlowModel,
    });
    this.registerFileAccessAuthorizer();
    this.app.on('afterLoad', () => {
      this.registerFileAccessAuthorizer();
    });
    this.app.dataSourceManager.afterAddDataSource((dataSource) => {
      dataSource.resourceManager.use(this.parseToken, {
        before: 'auth',
      });
      dataSource.resourceManager.use(this.appendUploadedFileToPublicFormCookie, {
        after: 'acl',
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
