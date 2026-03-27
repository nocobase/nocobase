/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { InstallOptions, Plugin } from '@nocobase/server';
import _ from 'lodash';
import flowModelTemplates from './resources/flowModelTemplates';
import flowModelTemplateUsages from './resources/flowModelTemplateUsages';
import { FlowModelRepository } from '@nocobase/plugin-flow-engine';
import { uid } from '@nocobase/utils';

export class PluginBlockReferenceServer extends Plugin {
  async load() {
    this.app.resourceManager.define(flowModelTemplates);
    this.app.resourceManager.define(flowModelTemplateUsages);

    this.app.acl.allow('flowModelTemplates', '*', 'loggedIn');
    this.app.acl.allow('flowModelTemplateUsages', '*', 'loggedIn');
    this.app.acl.registerSnippet({
      name: `pm.${this.name}.templates`,
      actions: ['flowModelTemplates:*', 'flowModelTemplateUsages:*'],
    });

    this.app.auditManager?.registerActions([
      'flowModelTemplates:create',
      'flowModelTemplates:update',
      'flowModelTemplates:destroy',
      'flowModelTemplateUsages:create',
      'flowModelTemplateUsages:destroy',
    ]);

    const parseOptions = (value: any) => FlowModelRepository.optionsToJson(value || {});
    const omitSubModels = (value: any) => {
      if (!value || typeof value !== 'object') return value;
      const { subModels, ...rest } = value;
      return rest;
    };
    const collectFlowModelsFromTree = (value: any) => {
      const result: Array<any> = [];
      const ensureNodeUid = (node: any): string => {
        const existing = node?.uid;
        if (typeof existing === 'string' && existing) return existing;
        if (typeof existing === 'undefined' || existing === null || existing === '') {
          const next = uid();
          node.uid = next;
          return next;
        }
        throw new Error('[block-reference] flowModels uid must be a non-empty string');
      };
      const walk = (node: any, inheritedParentId?: string) => {
        if (!node || typeof node !== 'object') return;
        const nodeUid = ensureNodeUid(node);
        const nextNode = omitSubModels(node);
        if (inheritedParentId && nextNode && typeof nextNode === 'object' && !nextNode.parentId) {
          nextNode.parentId = inheritedParentId;
        }
        if (nodeUid) {
          result.push(nextNode);
        }
        const subModels = node?.subModels;
        if (!subModels || typeof subModels !== 'object') return;
        for (const val of Object.values(subModels)) {
          const items = Array.isArray(val) ? val : [val];
          for (const child of items) {
            walk(child, nodeUid || inheritedParentId);
          }
        }
      };
      walk(value);
      return result;
    };
    const extractTemplateUids = (options: any) => {
      const stepParams = options?.stepParams || {};
      const uids = new Set<string>();

      // 模板引用（不限定 use；后续其它模型也可复用 referenceSettings.useTemplate ）
      const mode = _.get(stepParams, ['referenceSettings', 'useTemplate', 'mode']) || 'reference';
      const tplUid = _.get(stepParams, ['referenceSettings', 'useTemplate', 'templateUid']);
      if (tplUid && mode !== 'copy') {
        uids.add(String(tplUid));
      }

      // openView（弹窗模板引用）
      // 兼容：openView step key 可能不是 "openView"，这里扫描 popupSettings 下所有 stepParams
      const popupSettings = _.get(stepParams, ['popupSettings']);
      if (popupSettings && typeof popupSettings === 'object') {
        for (const val of Object.values(popupSettings)) {
          if (!val || typeof val !== 'object') continue;
          const step = val as Record<string, unknown>;
          const tplUidRaw = step['popupTemplateUid'];
          const tplMode = String(step['popupTemplateMode'] || '') || 'reference';
          if (tplUidRaw !== null && typeof tplUidRaw !== 'undefined' && String(tplUidRaw) && tplMode !== 'copy') {
            uids.add(String(tplUidRaw));
          }
        }
      }

      return Array.from(uids);
    };

    const syncUsages = async (instanceUid: string, options: any, { transaction }: { transaction?: any } = {}) => {
      const usageRepo = this.db.getRepository('flowModelTemplateUsages');
      const currentUids = _.uniq(extractTemplateUids(options).map(String));

      await usageRepo.destroy({
        filter: { modelUid: instanceUid },
        transaction,
      });

      for (const templateUid of currentUids) {
        await usageRepo.updateOrCreate({
          filterKeys: ['templateUid', 'modelUid'],
          values: { uid: uid(), templateUid, modelUid: instanceUid },
          transaction,
          context: { disableAfterDestroy: true },
        });
      }
    };

    const removeUsagesByInstance = async (instanceUid: string, { transaction }: { transaction?: any } = {}) => {
      const usageRepo = this.db.getRepository('flowModelTemplateUsages');
      await usageRepo.destroy({ filter: { modelUid: instanceUid }, transaction });
    };

    const syncUsagesFromTree = async (
      tree: any,
      {
        transaction,
        skipNodesWithoutTemplateRefs = false,
      }: { transaction?: any; skipNodesWithoutTemplateRefs?: boolean } = {},
    ) => {
      const nodes = collectFlowModelsFromTree(tree);
      for (const node of nodes) {
        const instanceUid = node?.uid;
        if (!instanceUid) continue;
        const currentOptions = parseOptions(node);
        if (skipNodesWithoutTemplateRefs && extractTemplateUids(currentOptions).length === 0) {
          continue;
        }
        await syncUsages(instanceUid, currentOptions, { transaction });
      }
    };

    const removeUsagesFromNodes = async (
      nodes: Array<{ uid?: string }>,
      { transaction }: { transaction?: any } = {},
    ) => {
      for (const node of nodes) {
        const instanceUid = node?.uid;
        if (!instanceUid) continue;
        await removeUsagesByInstance(instanceUid, { transaction });
      }
    };

    const syncUsagesForTouchedUids = async (
      flowRepo: FlowModelRepository,
      uids: string[],
      { transaction }: { transaction?: any } = {},
    ) => {
      for (const instanceUid of _.uniq(uids.map((item) => String(item || '').trim()).filter(Boolean))) {
        const record = await flowRepo.findOne({
          filter: { uid: instanceUid },
          transaction,
        });
        if (!record) continue;
        const currentOptions = parseOptions(record?.get?.('options') || record?.options);
        await syncUsages(instanceUid, currentOptions, { transaction });
      }
    };

    // 区块删除时自动清理 usage 记录，避免垃圾数据
    this.db.on('flowModels.afterDestroy', async (instance: any, { transaction }: any = {}) => {
      const instanceUid = instance?.get?.('uid') || instance?.uid;
      if (!instanceUid) return;
      await removeUsagesByInstance(instanceUid, { transaction });
    });

    // 区块保存时维护 usage：
    // - referenceSettings.useTemplate.templateUid（且 mode!==copy）
    // - popupSettings.openView.popupTemplateUid + popupTemplateMode!==copy
    const handleFlowModelSave = async (instance: any, { transaction }: any = {}) => {
      const instanceUid = instance?.get?.('uid') || instance?.uid;
      if (!instanceUid) return;

      const options = parseOptions(instance?.get?.('options') || instance?.options);
      await syncUsages(instanceUid, options, { transaction });
    };

    this.db.on('flowModels.afterSaveWithAssociations', handleFlowModelSave);

    // flowModels:save/destroy 等自定义 action 不会触发 afterSaveWithAssociations/afterDestroy（FlowModelRepository 使用 hooks:false + raw SQL）
    // 这里通过 resourcer middleware 补齐 usages 维护，保持“后端自动维护”为主的设计。
    this.app.resourceManager.use(async (ctx: any, next) => {
      const isFlowModels = ctx?.action?.resourceName === 'flowModels';
      if (!isFlowModels) {
        return next();
      }

      const actionName = ctx?.action?.actionName;

      if (actionName === 'save') {
        const values = ctx?.action?.params?.values;
        if (!values || typeof values !== 'object') {
          ctx.throw(400, {
            code: 'INVALID_PAYLOAD',
            message: 'values is required',
          });
        }
        const nodes = collectFlowModelsFromTree(values);

        await next();

        for (const node of nodes) {
          const instanceUid = node?.uid;
          if (!instanceUid) continue;
          const currentOptions = parseOptions(node);
          await syncUsages(instanceUid, currentOptions, { transaction: ctx.transaction });
        }
        return;
      }

      if (actionName === 'destroy') {
        const rootUid = ctx?.action?.params?.filterByTk;
        if (!rootUid || typeof rootUid !== 'string') {
          ctx.throw(400, {
            code: 'INVALID_PAYLOAD',
            message: 'filterByTk is required',
          });
        }
        const flowRepo = ctx.db.getRepository('flowModels') as FlowModelRepository;
        const nodes = (await flowRepo.findNodesById(rootUid, {
          includeAsyncNode: true,
          transaction: ctx.transaction,
        })) as Array<{ uid?: string }>;

        await next();

        await removeUsagesFromNodes(nodes, { transaction: ctx.transaction });
        return;
      }

      if (actionName === 'duplicate') {
        await next();
        await syncUsagesFromTree(ctx.body?.data ?? ctx.body, {
          transaction: ctx.transaction,
          skipNodesWithoutTemplateRefs: true,
        });
        return;
      }

      if (actionName === 'ensure') {
        await next();
        await syncUsagesFromTree(ctx.body?.data ?? ctx.body, {
          transaction: ctx.transaction,
        });
        return;
      }

      if (actionName === 'mutate') {
        const values = ctx?.action?.params?.values;
        const ops = Array.isArray(values?.ops) ? values.ops : [];
        const flowRepo = ctx.db.getRepository('flowModels') as FlowModelRepository;

        await next();

        const data = ctx.body?.data ?? ctx.body;
        const results = Array.isArray(data?.results) ? data.results : [];
        if (!results.length) {
          return;
        }

        const resultsByOpId = new Map<string, any>();
        for (const result of results) {
          const opId = String(result?.opId || '').trim();
          if (!opId) continue;
          resultsByOpId.set(opId, result);
        }

        const destroyedNodesByOpId = ctx?.state?.flowModelsMutateMeta?.destroyedNodesByOpId || {};

        for (const op of ops) {
          const opId = String(op?.opId || '').trim();
          if (!opId) continue;

          const result = resultsByOpId.get(opId);
          if (!result?.ok) continue;

          if (op?.type === 'duplicate') {
            await syncUsagesFromTree(result?.output, {
              transaction: ctx.transaction,
              skipNodesWithoutTemplateRefs: true,
            });
            continue;
          }

          if (op?.type === 'ensure') {
            await syncUsagesFromTree(result?.output, { transaction: ctx.transaction });
            continue;
          }

          if (op?.type === 'upsert') {
            const modelValues = op?.params?.values;
            if (!modelValues || typeof modelValues !== 'object') continue;

            if (modelValues?.subModels && typeof modelValues.subModels === 'object') {
              await syncUsagesFromTree(result?.output, { transaction: ctx.transaction });
            } else {
              await syncUsagesForTouchedUids(flowRepo, [String(modelValues?.uid || '')], {
                transaction: ctx.transaction,
              });
            }
            continue;
          }

          if (op?.type === 'destroy') {
            await removeUsagesFromNodes(destroyedNodesByOpId[opId] || [], {
              transaction: ctx.transaction,
            });
          }
        }
        return;
      }

      return next();
    });
  }

  async install(options?: InstallOptions) {}
  async afterEnable() {}
  async afterDisable() {}
  async remove() {}
}

export default PluginBlockReferenceServer;
