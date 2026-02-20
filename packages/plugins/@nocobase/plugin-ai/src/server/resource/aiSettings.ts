/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ResourceOptions } from '@nocobase/resourcer';
import { PluginFileManagerServer } from '@nocobase/plugin-file-manager';
import PluginAIServer from '../plugin';
import { EEFeatures } from '../manager/ai-feature-manager';

export const aiSettings: ResourceOptions = {
  name: 'aiSettings',
  actions: {
    get: async (ctx, next) => {
      const settings = await ctx.db.getRepository('aiSettings').findOne();
      ctx.body = {
        ...settings?.options,
        defaultLLMService: settings?.defaultLLMService,
        defaultModel: settings?.defaultModel,
      };
      await next();
    },
    update: async (ctx, next) => {
      const settings = await ctx.db.getRepository('aiSettings').findOne();
      const { defaultLLMService, defaultModel, ...restValues } = ctx.action.params.values || {};
      const options = settings.get('options');
      const newOptions = {
        ...options,
        ...restValues,
      };
      const updateData: Record<string, any> = { options: newOptions };
      if (defaultLLMService !== undefined) {
        updateData.defaultLLMService = defaultLLMService;
      }
      if (defaultModel !== undefined) {
        updateData.defaultModel = defaultModel;
      }
      await settings.update(updateData);
      await next();
    },
    publicGet: async (ctx, next) => {
      const settings = await ctx.db.getRepository('aiSettings').findOne();
      const options = settings.options;
      ctx.body = {
        storage: options.storage,
      };
      await next();
    },
    listStorages: async (ctx, next) => {
      const plugin = ctx.app.pm.get('file-manager') as PluginFileManagerServer;
      const storages = plugin.storagesCache.values();
      ctx.body = Array.from(storages).map((storage) => ({
        label: storage.title,
        value: storage.name,
      }));
      await next();
    },
    isKnowledgeBaseEnabled: async (ctx, next) => {
      const plugin = ctx.app.pm.get('ai') as PluginAIServer;
      const enabled = plugin.features.isFeaturesEnabled(Object.values(EEFeatures));
      ctx.body = {
        enabled,
      };
      await next();
    },
  },
};

export default aiSettings;
