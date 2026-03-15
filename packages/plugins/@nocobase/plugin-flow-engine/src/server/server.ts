/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MagicAttributeModel } from '@nocobase/database';
import type {
  FlowActionSchemaManifest,
  FlowSchemaInventoryContribution,
  FlowModelSchemaManifest,
  FlowSchemaManifestContribution,
  FlowSchemaManifestProvider,
} from '@nocobase/flow-engine';
import PluginLocalizationServer from '@nocobase/plugin-localization';
import { Plugin } from '@nocobase/server';
import { uid } from '@nocobase/utils';
import _ from 'lodash';
import path, { resolve } from 'path';
import { uiSchemaActions } from './actions/ui-schema-action';
import { FlowSchemaService, type FlowSchemaValidationIssue } from './flow-schema-service';
import { FlowSchemaModel } from './model';
import FlowModelRepository, { FlowModelOperationError } from './repository';

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

type FlowSchemaPluginProvider = Plugin & Partial<FlowSchemaManifestProvider>;

function inferFlowSchemaManifestSource(plugin: Plugin) {
  const packageName = String(plugin?.options?.packageName || '').trim();
  if (plugin?.name === 'flow-engine' || packageName === '@nocobase/plugin-flow-engine') {
    return 'official' as const;
  }
  if (packageName.startsWith('@nocobase/')) {
    return 'plugin' as const;
  }
  return 'third-party' as const;
}

function normalizeActionManifests(
  manifests: FlowSchemaManifestContribution['actions'],
  defaults: NonNullable<FlowSchemaManifestContribution['defaults']>,
): FlowActionSchemaManifest[] {
  if (!manifests) {
    return [];
  }

  if (Array.isArray(manifests)) {
    return manifests.filter(Boolean).map((manifest) => ({
      ...manifest,
      source: manifest.source ?? defaults.source,
      strict: manifest.strict ?? defaults.strict,
    }));
  }

  return Object.entries(manifests)
    .filter(([, manifest]) => !!manifest)
    .map(([name, manifest]) => ({
      ...manifest,
      name: manifest.name || name,
      source: manifest.source ?? defaults.source,
      strict: manifest.strict ?? defaults.strict,
    }));
}

function normalizeModelManifests(
  manifests: FlowSchemaManifestContribution['models'],
  defaults: NonNullable<FlowSchemaManifestContribution['defaults']>,
): FlowModelSchemaManifest[] {
  if (!manifests) {
    return [];
  }

  if (Array.isArray(manifests)) {
    return manifests.filter(Boolean).map((manifest) => ({
      ...manifest,
      source: manifest.source ?? defaults.source,
      strict: manifest.strict ?? defaults.strict,
    }));
  }

  return Object.entries(manifests)
    .filter(([, manifest]) => !!manifest)
    .map(([use, manifest]) => ({
      ...manifest,
      use: manifest.use || use,
      source: manifest.source ?? defaults.source,
      strict: manifest.strict ?? defaults.strict,
    }));
}

function normalizeInventoryContribution(
  inventory: FlowSchemaManifestContribution['inventory'],
): FlowSchemaInventoryContribution | undefined {
  if (!inventory) {
    return undefined;
  }

  const publicModels = Array.isArray(inventory.publicModels)
    ? inventory.publicModels.map((item) => String(item || '').trim()).filter(Boolean)
    : [];
  const publicActions = Array.isArray(inventory.publicActions)
    ? inventory.publicActions.map((item) => String(item || '').trim()).filter(Boolean)
    : [];

  if (!publicModels.length && !publicActions.length) {
    return undefined;
  }

  return {
    ...(publicModels.length ? { publicModels: _.uniq(publicModels) } : {}),
    ...(publicActions.length ? { publicActions: _.uniq(publicActions) } : {}),
  };
}

export class PluginUISchemaStorageServer extends Plugin {
  protected readonly flowSchemaService = new FlowSchemaService();

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
    await this.collectPluginFlowSchemaManifests();

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
          const repository = this.db.getCollection('flowModels').repository as FlowModelRepository;
          if (uid) {
            ctx.body = await repository.findModelById(uid, { includeAsyncNode });
          } else if (parentId) {
            ctx.body = await repository.findModelByParentId(parentId, { subKey, includeAsyncNode });
          }
          await next();
        },
        duplicate: async (ctx, next) => {
          const { uid } = ctx.action.params;
          const repository = this.db.getCollection('flowModels').repository as FlowModelRepository;
          const duplicated = await repository.duplicate(uid);
          ctx.body = duplicated;
          await next();
        },
        schema: async (ctx, next) => {
          const { use } = ctx.action.params as any;
          const modelUse = String(use || '').trim();
          if (!modelUse) {
            ctx.throw(400, "flowModels:schema requires non-empty 'use'", {
              code: 'INVALID_PARAMS',
            });
          }
          const document = this.flowSchemaService.getDocument(modelUse);
          if (!document) {
            ctx.throw(404, `No public flow schema document found for use "${modelUse}"`, {
              code: 'FLOW_MODEL_SCHEMA_NOT_FOUND',
            });
          }
          ctx.body = document;
          await next();
        },
        schemas: async (ctx, next) => {
          const payload = (ctx.action.params as any)?.values ?? (ctx.action.params as any) ?? {};
          const uses = Array.isArray(payload?.uses)
            ? payload.uses.map((item) => String(item || '').trim()).filter(Boolean)
            : [];
          ctx.body = this.flowSchemaService.getDocuments(uses);
          await next();
        },
        schemaBundle: async (ctx, next) => {
          const payload = (ctx.action.params as any)?.values ?? (ctx.action.params as any) ?? {};
          const uses = Array.isArray(payload?.uses)
            ? payload.uses.map((item) => String(item || '').trim()).filter(Boolean)
            : [];
          ctx.body = this.flowSchemaService.getBundle(uses);
          await next();
        },
        attach: async (ctx, next) => {
          const { uid, parentId, subKey, subType, position } = ctx.action.params;
          const repository = this.db.getCollection('flowModels').repository as FlowModelRepository;
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
          const repository = this.db.getCollection('flowModels').repository as FlowModelRepository;
          await repository.move({ sourceId, targetId, position });
          ctx.body = 'ok';
          await next();
        },
        save: async (ctx, next) => {
          const { values } = ctx.action.params;
          const { return: returnType = 'model', includeAsyncNode = false } = ctx.action.params as any;
          const repository = this.db.getCollection('flowModels').repository as FlowModelRepository;
          try {
            this.assertValidFlowModelSchema(values);
            const uid = await repository.upsertModel(values);
            if (returnType && returnType !== 'model' && returnType !== 'uid') {
              ctx.throw(400, `Invalid query param 'return': ${returnType}`, {
                code: 'INVALID_PARAMS',
              });
            }
            if (returnType === 'uid') {
              ctx.body = uid;
            } else {
              ctx.body = await repository.findModelById(uid, { includeAsyncNode });
            }
          } catch (error) {
            if (error instanceof FlowModelOperationError) {
              this.respondWithFlowModelOperationError(ctx, error);
              return;
            }
            throw error;
          }
          await next();
        },
        ensure: async (ctx, next) => {
          const { includeAsyncNode = false } = ctx.action.params as any;
          const { values } = ctx.action.params as any;
          const repository = this.db.getCollection('flowModels').repository as FlowModelRepository;
          try {
            this.assertValidFlowModelSchema(values, { allowRootObjectLocator: true });
            ctx.body = await repository.ensureModel(values, { includeAsyncNode });
          } catch (error) {
            if (error instanceof FlowModelOperationError) {
              this.respondWithFlowModelOperationError(ctx, error);
              return;
            }
            throw error;
          }
          await next();
        },
        mutate: async (ctx, next) => {
          const { includeAsyncNode = false } = ctx.action.params as any;
          const { values } = ctx.action.params as any;
          const repository = this.db.getCollection('flowModels').repository as FlowModelRepository;

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

          const transaction = await ctx.db.sequelize.transaction();
          try {
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
                let output: any;

                if (type === 'ensure') {
                  this.assertValidFlowModelSchema(params, { allowRootObjectLocator: true });
                  output = await repository.ensureModel(params, { transaction, includeAsyncNode });
                } else if (type === 'upsert') {
                  const modelValues = params?.values;
                  const modelUid = String(modelValues?.uid || '').trim();
                  if (!modelUid) {
                    throw new FlowModelOperationError({
                      status: 400,
                      code: 'INVALID_PARAMS',
                      message: "flowModels:mutate upsert requires 'params.values.uid' for retry-safety",
                    });
                  }
                  this.assertValidFlowModelSchema(modelValues);
                  await repository.upsertModel(modelValues, { transaction });
                  output = await repository.findModelById(modelUid, { transaction, includeAsyncNode });
                } else if (type === 'destroy') {
                  const uid = String(params?.uid || '').trim();
                  if (!uid) {
                    throw new FlowModelOperationError({
                      status: 400,
                      code: 'INVALID_PARAMS',
                      message: "flowModels:mutate destroy requires 'params.uid'",
                    });
                  }
                  await repository.remove(uid, { transaction });
                  output = { ok: true, uid };
                } else if (type === 'attach') {
                  output = await repository.attach(
                    String(params?.uid || ''),
                    {
                      parentId: String(params?.parentId || ''),
                      subKey: String(params?.subKey || ''),
                      subType: params?.subType,
                      position: params?.position,
                    } as any,
                    { transaction },
                  );
                } else if (type === 'move') {
                  await repository.move(
                    {
                      sourceId: String(params?.sourceId || ''),
                      targetId: String(params?.targetId || ''),
                      position: params?.position,
                    },
                    { transaction },
                  );
                  output = { ok: true };
                } else if (type === 'duplicate') {
                  output = await repository.duplicateWithTargetUid(
                    String(params?.uid || ''),
                    String(params?.targetUid || ''),
                    {
                      transaction,
                      includeAsyncNode,
                    },
                  );
                } else {
                  throw new FlowModelOperationError({
                    status: 400,
                    code: 'INVALID_PARAMS',
                    message: `flowModels:mutate unsupported op type '${type}'`,
                  });
                }

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

            await transaction.commit();

            ctx.body = {
              results,
              ...(models ? { models } : {}),
            };
          } catch (error) {
            await transaction.rollback();
            if (error instanceof FlowModelOperationError) {
              this.respondWithFlowModelOperationError(ctx, error);
              return;
            }
            throw error;
          }

          await next();
        },
        destroy: async (ctx, next) => {
          const { filterByTk } = ctx.action.params;
          const repository = this.db.getCollection('flowModels').repository as FlowModelRepository;
          await repository.remove(filterByTk);
          ctx.body = 'ok';
          await next();
        },
      },
    });

    this.app.acl.allow('flowModels', ['findOne'], 'loggedIn');
  }

  protected async collectPluginFlowSchemaManifests() {
    for (const plugin of this.app.pm.getPlugins().values()) {
      if (!plugin?.enabled) {
        continue;
      }

      const provider = plugin as FlowSchemaPluginProvider;
      if (typeof provider.getFlowSchemaManifests !== 'function') {
        continue;
      }

      const contribution = await provider.getFlowSchemaManifests();
      if (!contribution) {
        continue;
      }

      const defaults = {
        source: contribution.defaults?.source ?? inferFlowSchemaManifestSource(plugin),
        strict: contribution.defaults?.strict,
      };
      const actionManifests = normalizeActionManifests(contribution.actions, defaults);
      const modelManifests = normalizeModelManifests(contribution.models, defaults);
      const inventory = normalizeInventoryContribution(contribution.inventory);

      if (actionManifests.length > 0) {
        this.flowSchemaService.registerActionManifests(actionManifests);
      }
      if (modelManifests.length > 0) {
        this.flowSchemaService.registerModelManifests(modelManifests);
      }
      if (inventory) {
        this.flowSchemaService.registerInventory(inventory, defaults.source);
      }
    }
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

  registerFlowSchemas(options: {
    models?: Record<string, any>;
    actions?: Record<string, any>;
    modelManifests?: any[] | Record<string, any>;
    actionManifests?: any[] | Record<string, any>;
    inventory?: FlowSchemaInventoryContribution;
  }) {
    if (options?.models) {
      this.flowSchemaService.registerModels(options.models);
    }
    if (options?.actions) {
      this.flowSchemaService.registerActions(options.actions);
    }
    if (options?.modelManifests) {
      this.flowSchemaService.registerModelManifests(options.modelManifests);
    }
    if (options?.actionManifests) {
      this.flowSchemaService.registerActionManifests(options.actionManifests);
    }
    if (options?.inventory) {
      this.flowSchemaService.registerInventory(options.inventory, 'third-party');
    }
  }

  private assertValidFlowModelSchema(
    values: any,
    options: {
      allowRootObjectLocator?: boolean;
    } = {},
  ) {
    const issues = this.flowSchemaService.validateModelTree(values, options);
    const errors = issues.filter((item) => item.level === 'error');
    const warnings = issues.filter((item) => item.level === 'warning');

    if (warnings.length) {
      warnings.forEach((warning) => {
        this.app.logger.warn(warning.message, {
          type: 'flow-model-schema-warning',
          ...warning,
        });
      });
    }

    if (!errors.length) {
      return;
    }

    throw new FlowModelOperationError({
      status: 400,
      code: 'INVALID_FLOW_MODEL_SCHEMA',
      message: 'Flow model payload does not match registered JSON schema.',
      details: {
        errors: errors.map((item) => this.toValidationError(item)),
      },
    });
  }

  private toValidationError(issue: FlowSchemaValidationIssue) {
    return {
      jsonPointer: issue.jsonPointer,
      modelUid: issue.modelUid,
      modelUse: issue.modelUse,
      section: issue.section,
      keyword: issue.keyword,
      message: issue.message,
      expectedType: issue.expectedType,
      allowedValues: issue.allowedValues,
      suggestedUses: issue.suggestedUses,
      schemaHash: issue.schemaHash,
    };
  }

  private respondWithFlowModelOperationError(ctx: any, error: FlowModelOperationError) {
    const responseError: {
      message: string;
      code: string;
      details?: any;
      opId?: string;
      opIndex?: number;
    } = {
      message: error.message,
      code: error.code,
    };

    if (typeof error.details !== 'undefined') {
      responseError.details = error.details;
    }

    const opId =
      typeof error.details?.opId === 'string'
        ? error.details.opId
        : typeof (error as any)?.opId === 'string'
          ? (error as any).opId
          : undefined;
    if (opId) {
      responseError.opId = opId;
    }

    const opIndex =
      typeof error.details?.opIndex === 'number'
        ? error.details.opIndex
        : typeof (error as any)?.opIndex === 'number'
          ? (error as any).opIndex
          : undefined;
    if (typeof opIndex === 'number') {
      responseError.opIndex = opIndex;
    }

    ctx.status = error.status;
    ctx.withoutDataWrapping = true;
    ctx.body = {
      errors: [responseError],
    };
  }
}

export default PluginUISchemaStorageServer;
