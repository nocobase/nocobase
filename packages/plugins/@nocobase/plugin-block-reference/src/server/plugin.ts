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
      // ReferenceFormGridModel 作为表单块的子模型，usage 归属到父级 blockUid
      if (options?.use === 'ReferenceFormGridModel') {
        const parentId = options?.parentId;
        if (parentId && typeof parentId === 'string') return parentId;
      }
      return instanceUid;
    };

    // 区块删除时自动清理 usage 记录，避免垃圾数据
    this.db.on('flowModels.afterDestroy', async (instance: any, { transaction }: any = {}) => {
      const usageRepo = this.db.getRepository('flowModelTemplateUsages');
      const instanceUid = instance?.get?.('uid') || instance?.uid;
      if (!instanceUid) return;
      const options = parseOptions(instance?.get?.('options') || instance?.options);
      const ownerUid = resolveUsageOwnerUid(instanceUid, options);

      // 对于 ReferenceFormGridModel，只清理本次引用的 templateUid，避免误伤同一 blockUid 下的其它 usage
      if (options?.use === 'ReferenceFormGridModel') {
        const templateUids = extractTemplateUids(options);
        for (const templateUid of templateUids) {
          await usageRepo.destroy({
            filter: { blockUid: ownerUid, templateUid },
            transaction,
          });
        }
        return;
      }

      await usageRepo.destroy({ filter: { blockUid: ownerUid }, transaction });
    });

    // 区块保存时维护 usage：
    // - ReferenceBlockModel.useTemplate + mode!==copy
    // - ReferenceFormGridModel.referenceFormGridSettings.target.templateUid
    // - subModelReferenceSettings.refs 中的 templateUid + mode!==copy（兼容历史/实验实现）
    const handleFlowModelSave = async (instance: any, { transaction }: any = {}) => {
      const usageRepo = this.db.getRepository('flowModelTemplateUsages');
      const instanceUid = instance?.get?.('uid') || instance?.uid;
      if (!instanceUid) return;

      const options = parseOptions(instance?.get?.('options') || instance?.options);
      const previousOptions = parseOptions(instance?.previous?.('options') ?? instance?._previousDataValues?.options);

      const currentOwnerUid = resolveUsageOwnerUid(instanceUid, options);
      const previousOwnerUid = resolveUsageOwnerUid(instanceUid, previousOptions);
      const currentUids = new Set(extractTemplateUids(options).map(String));
      const previousUids = new Set(extractTemplateUids(previousOptions).map(String));

      // owner 变更：需要从旧 owner 清理，再写入新 owner
      if (currentOwnerUid !== previousOwnerUid) {
        for (const templateUid of previousUids) {
          await usageRepo.destroy({
            filter: { blockUid: previousOwnerUid, templateUid },
            transaction,
          });
        }
        for (const templateUid of currentUids) {
          await usageRepo.updateOrCreate({
            filterKeys: ['templateUid', 'blockUid'],
            values: { uid: uid(), templateUid, blockUid: currentOwnerUid },
            transaction,
            context: { disableAfterDestroy: true },
          });
        }
        return;
      }

      // owner 未变更：按差异增删，避免误伤同 blockUid 的其它 usage
      const removed = Array.from(previousUids).filter((x) => !currentUids.has(x));
      const added = Array.from(currentUids).filter((x) => !previousUids.has(x));
      if (removed.length === 0 && added.length === 0) return;

      for (const templateUid of removed) {
        await usageRepo.destroy({
          filter: { blockUid: currentOwnerUid, templateUid },
          transaction,
        });
      }
      for (const templateUid of added) {
        await usageRepo.updateOrCreate({
          filterKeys: ['templateUid', 'blockUid'],
          values: { uid: uid(), templateUid, blockUid: currentOwnerUid },
          transaction,
          context: { disableAfterDestroy: true },
        });
      }
    };

    this.db.on('flowModels.afterSaveWithAssociations', handleFlowModelSave);
  }

  async install(options?: InstallOptions) {}
  async afterEnable() {}
  async afterDisable() {}
  async remove() {}
}

export default PluginBlockReferenceServer;
