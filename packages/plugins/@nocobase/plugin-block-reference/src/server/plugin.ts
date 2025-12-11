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

    // 区块删除时自动清理 usage 记录，避免垃圾数据
    this.db.on('flowModels.afterDestroy', async (instance: any, { transaction }: any = {}) => {
      const usageRepo = this.db.getRepository('flowModelTemplateUsages');
      await usageRepo.destroy({
        filter: {
          blockUid: instance?.get?.('uid') || instance?.uid,
        },
        transaction,
      });
    });

    // 区块保存时维护 usage：仅 ReferenceBlockModel + useTemplate + mode!==copy 时保留
    const handleFlowModelSave = async (instance: any, { transaction }: any = {}) => {
      const usageRepo = this.db.getRepository('flowModelTemplateUsages');
      const blockUid = instance?.get?.('uid') || instance?.uid;
      const parseOptions = (value: any) => {
        try {
          return FlowModelRepository.optionsToJson(value || {});
        } catch {
          return {};
        }
      };
      const extractState = (options: any) => {
        const stepParams = options?.stepParams || {};
        const mode = _.get(stepParams, ['referenceSettings', 'target', 'mode']) || 'reference';
        const useTemplate = _.get(stepParams, ['referenceSettings', 'useTemplate']);
        return {
          isReference: options?.use === 'ReferenceBlockModel',
          mode,
          useTemplate,
          templateUid: useTemplate?.templateUid,
        };
      };

      const options = parseOptions(instance?.get?.('options') || instance?.options);
      const previousOptions = parseOptions(instance?.previous?.('options') ?? instance?._previousDataValues?.options);
      if (!blockUid) return;
      const current = extractState(options);
      const previous = extractState(previousOptions);
      if (
        current.isReference === previous.isReference &&
        current.templateUid === previous.templateUid &&
        current.mode === previous.mode
      ) {
        return;
      }

      const { isReference, templateUid, mode, useTemplate } = current;

      if (!isReference || !templateUid || mode === 'copy') {
        await usageRepo.destroy({
          filter: { blockUid },
          transaction,
        });
        return;
      }

      await usageRepo.destroy({
        filter: {
          blockUid,
          templateUid: {
            $ne: templateUid,
          },
        },
        transaction,
      });

      await usageRepo.updateOrCreate({
        filterKeys: ['templateUid', 'blockUid'],
        values: {
          uid: useTemplate?.uid,
          templateUid,
          blockUid,
        },
        transaction,
        context: { disableAfterDestroy: true },
      });
    };

    this.db.on('flowModels.afterSaveWithAssociations', handleFlowModelSave);
  }

  async install(options?: InstallOptions) {}
  async afterEnable() {}
  async afterDisable() {}
  async remove() {}
}

export default PluginBlockReferenceServer;
