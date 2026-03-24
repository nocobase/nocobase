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
  FlowActionSchemaContribution,
  FlowFieldBindingContextContribution,
  FlowFieldBindingContribution,
  FlowSchemaInventoryContribution,
  FlowModelSchemaContribution,
  FlowSchemaContribution,
  FlowSchemaContributionProvider,
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

function normalizeSchemaDetail(value: any) {
  return String(value || '').trim() === 'full' ? 'full' : 'compact';
}

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

type FlowSchemaPluginProvider = Plugin & Partial<FlowSchemaContributionProvider>;

function inferFlowSchemaContributionSource(plugin: Plugin) {
  const packageName = String(plugin?.options?.packageName || '').trim();
  if (plugin?.name === 'flow-engine' || packageName === '@nocobase/plugin-flow-engine') {
    return 'official' as const;
  }
  if (packageName.startsWith('@nocobase/')) {
    return 'plugin' as const;
  }
  return 'third-party' as const;
}

function normalizeActionContributions(
  contributions: FlowSchemaContribution['actions'],
  defaults: NonNullable<FlowSchemaContribution['defaults']>,
): FlowActionSchemaContribution[] {
  if (!contributions) {
    return [];
  }

  if (Array.isArray(contributions)) {
    return contributions.filter(Boolean).map((contribution) => ({
      ...contribution,
      source: contribution.source ?? defaults.source,
      strict: contribution.strict ?? defaults.strict,
    }));
  }

  return Object.entries(contributions)
    .filter(([, contribution]) => !!contribution)
    .map(([name, contribution]) => ({
      ...contribution,
      name: contribution.name || name,
      source: contribution.source ?? defaults.source,
      strict: contribution.strict ?? defaults.strict,
    }));
}

function normalizeModelContributions(
  contributions: FlowSchemaContribution['models'],
  defaults: NonNullable<FlowSchemaContribution['defaults']>,
): FlowModelSchemaContribution[] {
  if (!contributions) {
    return [];
  }

  if (Array.isArray(contributions)) {
    return contributions.filter(Boolean).map((contribution) => ({
      ...contribution,
      source: contribution.source ?? defaults.source,
      strict: contribution.strict ?? defaults.strict,
    }));
  }

  return Object.entries(contributions)
    .filter(([, contribution]) => !!contribution)
    .map(([use, contribution]) => ({
      ...contribution,
      use: contribution.use || use,
      source: contribution.source ?? defaults.source,
      strict: contribution.strict ?? defaults.strict,
    }));
}

function normalizeFieldBindingContexts(
  contributions: FlowSchemaContribution['fieldBindingContexts'],
): FlowFieldBindingContextContribution[] {
  if (!contributions) {
    return [];
  }

  if (Array.isArray(contributions)) {
    return contributions.filter(Boolean);
  }

  return Object.entries(contributions)
    .filter(([, contribution]) => !!contribution)
    .map(([name, contribution]) => ({
      ...contribution,
      name: contribution.name || name,
    }));
}

function normalizeFieldBindings(
  contributions: FlowSchemaContribution['fieldBindings'],
): FlowFieldBindingContribution[] {
  if (!contributions) {
    return [];
  }

  if (Array.isArray(contributions)) {
    return contributions.filter(Boolean);
  }

  return Object.entries(contributions).flatMap(([context, contribution]) => {
    const items = Array.isArray(contribution) ? contribution : contribution ? [contribution] : [];
    return items.filter(Boolean).map((item) => ({
      ...item,
      context: item.context || context,
    }));
  });
}

function normalizeInventoryContribution(
  inventory: FlowSchemaContribution['inventory'],
): FlowSchemaInventoryContribution | undefined {
  if (!inventory) {
    return undefined;
  }

  const publicTreeRoots = Array.isArray(inventory.publicTreeRoots)
    ? inventory.publicTreeRoots.map((item) => String(item || '').trim()).filter(Boolean)
    : [];

  if (!publicTreeRoots.length) {
    return undefined;
  }

  return {
    ...(publicTreeRoots.length ? { publicTreeRoots: _.uniq(publicTreeRoots) } : {}),
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

    this.flowSchemaService.setApp(this.app);
    this.app.db.registerModels({ MagicAttributeModel, FlowSchemaModel });

    this.registerRepository();
    await this.collectPluginFlowSchemaContributions();

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

    this.app.resourceManager.use(async (ctx: any, next) => {
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
        }
        if (error instanceof FlowModelOperationError) {
          this.respondWithFlowModelOperationError(ctx, error);
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
          const { use, detail } = ctx.action.params as any;
          const modelUse = String(use || '').trim();
          if (!modelUse) {
            ctx.throw(400, "flowModels:schema requires non-empty 'use'", {
              code: 'INVALID_PARAMS',
            });
          }
          const document = this.flowSchemaService.getPublicDocument(modelUse, {
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
        schemas: async (ctx, next) => {
          const payload = (ctx.action.params as any)?.values ?? (ctx.action.params as any) ?? {};
          const uses = Array.isArray(payload?.uses)
            ? payload.uses.map((item) => String(item || '').trim()).filter(Boolean)
            : [];
          ctx.body = this.flowSchemaService.getPublicDocuments(uses, {
            clone: false,
            detail: normalizeSchemaDetail(payload?.detail),
          });
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
          const { return: returnType = 'uid', includeAsyncNode = false } = ctx.action.params as any;
          const repository = this.db.getCollection('flowModels').repository as FlowModelRepository;
          try {
            if (returnType && returnType !== 'model' && returnType !== 'uid') {
              ctx.throw(400, `Invalid query param 'return': ${returnType}`, {
                code: 'INVALID_PARAMS',
              });
            }
            const normalizedValues = await this.assertValidFlowModelSchemaForSave(values, repository);
            const uid = await repository.upsertModel(normalizedValues);
            if (returnType === 'model') {
              ctx.body = await repository.findModelById(uid, { includeAsyncNode });
            } else {
              ctx.body = uid;
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
            const normalizedValues = this.assertValidFlowModelSchema(values, { allowRootObjectLocator: true });
            ctx.body = await repository.ensureModel(normalizedValues, { includeAsyncNode });
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
                const normalizedParams = this.assertValidFlowModelSchema(params, { allowRootObjectLocator: true });
                output = await repository.ensureModel(normalizedParams, { transaction, includeAsyncNode });
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
                const normalizedModelValues = this.assertValidFlowModelSchema(modelValues);
                await repository.upsertModel(normalizedModelValues, { transaction });
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
                const nodesToDestroy = await repository.findNodesById(uid, {
                  includeAsyncNode: true,
                  transaction,
                });
                destroyedNodesByOpId[opId] = _.uniqBy(nodesToDestroy, 'uid').map((node) => ({ uid: node.uid }));
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

          ctx.body = {
            results,
            ...(models ? { models } : {}),
          };

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

  protected async collectPluginFlowSchemaContributions() {
    for (const plugin of this.app.pm.getPlugins().values()) {
      if (!plugin?.enabled) {
        continue;
      }

      const provider = plugin as FlowSchemaPluginProvider;
      if (typeof provider.getFlowSchemaContributions !== 'function') {
        continue;
      }

      const contribution = await provider.getFlowSchemaContributions();
      if (!contribution) {
        continue;
      }

      const defaults = {
        source: contribution.defaults?.source ?? inferFlowSchemaContributionSource(plugin),
        strict: contribution.defaults?.strict,
      };
      const actionContributions = normalizeActionContributions(contribution.actions, defaults);
      const modelContributions = normalizeModelContributions(contribution.models, defaults);
      const fieldBindingContexts = normalizeFieldBindingContexts(contribution.fieldBindingContexts);
      const fieldBindings = normalizeFieldBindings(contribution.fieldBindings);
      const inventory = normalizeInventoryContribution(contribution.inventory);

      if (actionContributions.length > 0) {
        this.flowSchemaService.registerActionContributions(actionContributions);
      }
      if (modelContributions.length > 0) {
        this.flowSchemaService.registerModelContributions(modelContributions);
      }
      if (fieldBindingContexts.length > 0) {
        this.flowSchemaService.registerFieldBindingContexts(fieldBindingContexts);
      }
      if (fieldBindings.length > 0) {
        this.flowSchemaService.registerFieldBindings(fieldBindings, defaults.source);
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
    modelContributions?: any[] | Record<string, any>;
    actionContributions?: any[] | Record<string, any>;
    fieldBindingContexts?: FlowFieldBindingContextContribution[] | Record<string, FlowFieldBindingContextContribution>;
    fieldBindings?:
      | FlowFieldBindingContribution[]
      | Record<string, FlowFieldBindingContribution | FlowFieldBindingContribution[]>;
    inventory?: FlowSchemaInventoryContribution;
  }) {
    const defaults = {
      source: 'third-party' as const,
      strict: undefined,
    };
    if (options?.models) {
      this.flowSchemaService.registerModels(options.models);
    }
    if (options?.actions) {
      this.flowSchemaService.registerActions(options.actions);
    }
    if (options?.modelContributions) {
      this.flowSchemaService.registerModelContributions(
        normalizeModelContributions(options.modelContributions, defaults),
      );
    }
    if (options?.actionContributions) {
      this.flowSchemaService.registerActionContributions(
        normalizeActionContributions(options.actionContributions, defaults),
      );
    }
    if (options?.fieldBindingContexts) {
      this.flowSchemaService.registerFieldBindingContexts(options.fieldBindingContexts);
    }
    if (options?.fieldBindings) {
      this.flowSchemaService.registerFieldBindings(options.fieldBindings, 'third-party');
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
    const normalizedValues = this.flowSchemaService.normalizeModelTree(values, [], {
      allowRootObjectLocator: options.allowRootObjectLocator,
    });
    const validatedValues = this.validateNormalizedFlowModelSchema(normalizedValues, options);
    if (!options.allowRootObjectLocator) {
      return validatedValues;
    }
    return this.flowSchemaService.assignImplicitUids(validatedValues, {
      allowRootObjectLocator: options.allowRootObjectLocator,
    });
  }

  private async assertValidFlowModelSchemaForSave(values: any, repository: FlowModelRepository) {
    const { existingNodeUids, existingNodeUses } = await this.getExistingFlowModelSaveTreeMetadata(values, repository);
    const preparedValues = this.patchExistingFlowModelUses(values, existingNodeUses);
    const normalizedValues = this.flowSchemaService.normalizeModelTree(preparedValues);
    const normalizedWithUids = this.flowSchemaService.assignImplicitUids(normalizedValues);
    return this.validateNormalizedFlowModelSchema(normalizedWithUids, { existingNodeUids });
  }

  private validateNormalizedFlowModelSchema(
    normalizedValues: any,
    options: {
      allowRootObjectLocator?: boolean;
      existingNodeUids?: ReadonlySet<string>;
    } = {},
  ) {
    const issues = this.flowSchemaService.validateNormalizedModelTree(normalizedValues, options);
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
      return normalizedValues;
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

  private async getExistingFlowModelSaveTreeMetadata(values: any, repository: FlowModelRepository) {
    const rootUid = String(values?.uid || '').trim();
    const existingNodeUids = new Set<string>();
    const existingNodeUses = new Map<string, string>();

    if (!rootUid) {
      return {
        existingNodeUids,
        existingNodeUses,
      };
    }

    const existingNodes = await repository.findNodesById(rootUid, { includeAsyncNode: true });
    for (const node of existingNodes || []) {
      const nodeUid = String(node?.uid || '').trim();
      if (!nodeUid) {
        continue;
      }
      existingNodeUids.add(nodeUid);
      const nodeOptions = FlowModelRepository.optionsToJson(node.options);
      const nodeUse = String(nodeOptions?.use || '').trim();
      if (nodeUse) {
        existingNodeUses.set(nodeUid, nodeUse);
      }
    }

    return {
      existingNodeUids,
      existingNodeUses,
    };
  }

  private patchExistingFlowModelUses(values: any, existingNodeUses: ReadonlyMap<string, string>): any {
    if (!values || typeof values !== 'object') {
      return values;
    }

    if (Array.isArray(values)) {
      return values.map((item) => this.patchExistingFlowModelUses(item, existingNodeUses));
    }

    const nextValues = { ...values };
    const nodeUid = String(values?.uid || '').trim();
    if (nodeUid && !String(values?.use || '').trim()) {
      const existingUse = existingNodeUses.get(nodeUid);
      if (existingUse) {
        nextValues.use = existingUse;
      }
    }

    const subModels = values?.subModels;
    if (!subModels || typeof subModels !== 'object' || Array.isArray(subModels)) {
      return nextValues;
    }

    nextValues.subModels = Object.fromEntries(
      Object.entries(subModels).map(([slotKey, slotValue]) => [
        slotKey,
        Array.isArray(slotValue)
          ? slotValue.map((item) => this.patchExistingFlowModelUses(item, existingNodeUses))
          : this.patchExistingFlowModelUses(slotValue, existingNodeUses),
      ]),
    );

    return nextValues;
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
      fieldInterface: issue.fieldInterface,
      fieldType: issue.fieldType,
      targetCollectionTemplate: issue.targetCollectionTemplate,
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
