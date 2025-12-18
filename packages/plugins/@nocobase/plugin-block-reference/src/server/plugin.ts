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

      // ReferenceBlockModel 模板引用
      if (options?.use === 'ReferenceBlockModel') {
        const mode = _.get(stepParams, ['referenceSettings', 'target', 'mode']) || 'reference';
        const tplUid = _.get(stepParams, ['referenceSettings', 'useTemplate', 'templateUid']);
        if (tplUid && mode !== 'copy') {
          uids.add(String(tplUid));
        }
      }

      // ReferenceFormGridModel（字段模板引用）
      if (options?.use === 'ReferenceFormGridModel') {
        const tplUid = _.get(stepParams, ['referenceFormGridSettings', 'target', 'templateUid']);
        if (tplUid) {
          uids.add(String(tplUid));
        }
      }

      // openView（弹窗模板引用）
      // 兼容：openView step key 可能不是 "openView"，这里扫描 popupSettings 下所有 stepParams
      const popupSettings = _.get(stepParams, ['popupSettings']);
      if (popupSettings && typeof popupSettings === 'object') {
        for (const val of Object.values(popupSettings)) {
          if (!val || typeof val !== 'object') continue;
          const step = val as Record<string, unknown>;
          const tplUidRaw = step['popupTemplateUid'];
          if (tplUidRaw !== null && typeof tplUidRaw !== 'undefined' && String(tplUidRaw)) {
            uids.add(String(tplUidRaw));
          }
        }
      }

      // 兼容：subModelReferenceSettings.refs 中的 templateUid（历史/实验实现）
      const normalizeRefs = (val: any) => {
        if (!val) return [];
        if (Array.isArray(val)) return val;
        if (Array.isArray(val?.refs)) return val.refs;
        if (typeof val === 'object') {
          return Object.values(val).filter((r: any) => r && typeof r === 'object');
        }
        return [];
      };
      const refsRaw = _.get(stepParams, ['subModelReferenceSettings', 'refs']);
      const refs = normalizeRefs(refsRaw);
      for (const r of refs) {
        const tplUid = r?.templateUid;
        const mode = r?.mode || 'reference';
        if (tplUid && mode !== 'copy') {
          uids.add(String(tplUid));
        }
      }

      return Array.from(uids);
    };

    const resolveUsageOwnerUid = (instanceUid: string, options: any): string => {
      // ReferenceFormGridModel 作为表单块的子模型，usage 归属到父级 modelUid
      if (options?.use === 'ReferenceFormGridModel') {
        const parentId = options?.parentId;
        if (parentId && typeof parentId === 'string') return parentId;
      }
      return instanceUid;
    };

    const syncUsages = async (
      instanceUid: string,
      options: any,
      previousOptions: any,
      { transaction }: { transaction?: any } = {},
    ) => {
      const usageRepo = this.db.getRepository('flowModelTemplateUsages');
      const currentOwnerUid = resolveUsageOwnerUid(instanceUid, options);
      const previousOwnerUid = resolveUsageOwnerUid(instanceUid, previousOptions);
      const currentUids = new Set(extractTemplateUids(options).map(String));
      const previousUids = new Set(extractTemplateUids(previousOptions).map(String));

      // owner 变更：需要从旧 owner 清理，再写入新 owner
      if (currentOwnerUid !== previousOwnerUid) {
        for (const templateUid of previousUids) {
          await usageRepo.destroy({
            filter: { modelUid: previousOwnerUid, templateUid },
            transaction,
          });
        }
        for (const templateUid of currentUids) {
          await usageRepo.updateOrCreate({
            filterKeys: ['templateUid', 'modelUid'],
            values: { uid: uid(), templateUid, modelUid: currentOwnerUid },
            transaction,
            context: { disableAfterDestroy: true },
          });
        }
        return;
      }

      // owner 未变更：按差异增删，避免误伤同 modelUid 的其它 usage
      const removed = Array.from(previousUids).filter((x) => !currentUids.has(x));
      const added = Array.from(currentUids).filter((x) => !previousUids.has(x));
      if (removed.length === 0 && added.length === 0) return;

      for (const templateUid of removed) {
        await usageRepo.destroy({
          filter: { modelUid: currentOwnerUid, templateUid },
          transaction,
        });
      }
      for (const templateUid of added) {
        await usageRepo.updateOrCreate({
          filterKeys: ['templateUid', 'modelUid'],
          values: { uid: uid(), templateUid, modelUid: currentOwnerUid },
          transaction,
          context: { disableAfterDestroy: true },
        });
      }
    };

    const removeUsagesByInstance = async (
      instanceUid: string,
      options: any,
      { transaction }: { transaction?: any } = {},
    ) => {
      const usageRepo = this.db.getRepository('flowModelTemplateUsages');
      const ownerUid = resolveUsageOwnerUid(instanceUid, options);

      // 对于 ReferenceFormGridModel，只清理本次引用的 templateUid，避免误伤同一 modelUid 下的其它 usage
      if (options?.use === 'ReferenceFormGridModel') {
        const templateUids = extractTemplateUids(options);
        for (const templateUid of templateUids) {
          await usageRepo.destroy({
            filter: { modelUid: ownerUid, templateUid },
            transaction,
          });
        }
        return;
      }

      await usageRepo.destroy({ filter: { modelUid: ownerUid }, transaction });
    };

    // 区块删除时自动清理 usage 记录，避免垃圾数据
    this.db.on('flowModels.afterDestroy', async (instance: any, { transaction }: any = {}) => {
      const instanceUid = instance?.get?.('uid') || instance?.uid;
      if (!instanceUid) return;
      const options = parseOptions(instance?.get?.('options') || instance?.options);
      await removeUsagesByInstance(instanceUid, options, { transaction });
    });

    // 区块保存时维护 usage：
    // - ReferenceBlockModel.useTemplate + mode!==copy
    // - ReferenceFormGridModel.referenceFormGridSettings.target.templateUid
    // - popupSettings.openView.popupTemplateUid + popupTemplateMode!==copy
    // - subModelReferenceSettings.refs 中的 templateUid + mode!==copy（兼容历史/实验实现）
    const handleFlowModelSave = async (instance: any, { transaction }: any = {}) => {
      const instanceUid = instance?.get?.('uid') || instance?.uid;
      if (!instanceUid) return;

      const options = parseOptions(instance?.get?.('options') || instance?.options);
      const previousOptions = parseOptions(instance?.previous?.('options') ?? instance?._previousDataValues?.options);
      await syncUsages(instanceUid, options, previousOptions, { transaction });
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
        const uids = _.uniq(nodes.map((n) => n?.uid).filter(Boolean));

        const previousOptionsByUid = new Map<string, any>();
        if (uids.length) {
          const FlowModel = ctx.db.getModel('flowModels');
          const rows = await FlowModel.findAll({
            attributes: ['uid', 'options'],
            where: { uid: uids },
            raw: true,
            transaction: ctx.transaction,
          });
          for (const row of rows) {
            previousOptionsByUid.set(row.uid, parseOptions(row.options));
          }
        }

        await next();

        for (const node of nodes) {
          const instanceUid = node?.uid;
          if (!instanceUid) continue;
          const currentOptions = parseOptions(node);
          const previousOptions = previousOptionsByUid.get(instanceUid) || {};
          if (
            currentOptions?.use === 'ReferenceFormGridModel' &&
            !previousOptions?.parentId &&
            currentOptions?.parentId
          ) {
            previousOptions.parentId = currentOptions.parentId;
          }
          await syncUsages(instanceUid, currentOptions, previousOptions, { transaction: ctx.transaction });
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
        })) as Array<{ uid?: string; options?: unknown; parent?: string | null }>;

        await next();

        for (const node of nodes) {
          const instanceUid = node?.uid;
          if (!instanceUid) continue;
          const options = parseOptions(node?.options || {});
          if (node?.parent && !options?.parentId) {
            options.parentId = node.parent;
          }
          await removeUsagesByInstance(instanceUid, options, { transaction: ctx.transaction });
        }
        return;
      }

      if (actionName === 'duplicate') {
        await next();
        const raw = ctx.body?.data ?? ctx.body;
        const nodes = collectFlowModelsFromTree(raw);
        for (const node of nodes) {
          const instanceUid = node?.uid;
          if (!instanceUid) continue;
          const currentOptions = parseOptions(node);
          await syncUsages(instanceUid, currentOptions, {}, { transaction: ctx.transaction });
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
