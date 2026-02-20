/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ResourceOptions } from '@nocobase/resourcer';
import { PluginAIServer } from '../plugin';
import _ from 'lodash';
import { getRecommendedModels } from '../../common/recommended-models';

const aiResource: ResourceOptions = {
  name: 'ai',
  actions: {
    listLLMProviders: async (ctx, next) => {
      const plugin = ctx.app.pm.get('ai') as PluginAIServer;
      ctx.body = plugin.aiManager.listLLMProviders();
      await next();
    },
    listLLMServices: async (ctx, next) => {
      const plugin = ctx.app.pm.get('ai') as PluginAIServer;
      const { model } = ctx.action.params;
      const filter = ctx.action.params.filter ?? {};
      filter.enabled = { $ne: false };
      if (model) {
        const supportedProvider = plugin.aiManager.getSupportedProvider(model);
        if (!supportedProvider || _.isEmpty(supportedProvider)) {
          ctx.body = [];
          await next();
          return;
        }
        filter.provider = {
          $in: supportedProvider,
        };
      }
      const serviceList = await ctx.db.getRepository('llmServices').find({
        filter,
      });
      ctx.body = serviceList.map((x) => x.dataValues).map(({ options, ...rest }) => ({ ...rest }));
      await next();
    },
    listModels: async (ctx, next) => {
      const { llmService, model } = ctx.action.params;
      const plugin = ctx.app.pm.get('ai') as PluginAIServer;
      const service = await ctx.db.getRepository('llmServices').findOne({
        filter: {
          name: llmService,
        },
      });
      if (!service) {
        ctx.throw(400, 'invalid llm service');
      }
      const providerOptions = plugin.aiManager.llmProviders.get(service.provider);
      if (!providerOptions) {
        ctx.throw(400, 'invalid llm provider');
      }
      const options = service.options;
      const Provider = providerOptions.provider;
      const provider = new Provider({
        app: ctx.app,
        serviceOptions: options,
      });
      if (model && providerOptions.supportedModel.includes(model)) {
        ctx.body = providerOptions.models?.[model].map((id) => ({ id })) ?? [];
      } else {
        const res = await provider.listModels();
        if (res.errMsg) {
          ctx.log.error(res.errMsg);
          ctx.throw(
            res.code || 500,
            `${ctx.t('Get models list failed, you can enter a model name manually.')} ${res.errMsg}`,
          );
        }
        ctx.body = res.models || [];
      }

      return next();
    },
    listProviderModels: async (ctx, next) => {
      const { provider, options, model } = ctx.action.params.values ?? {};
      const plugin = ctx.app.pm.get('ai') as PluginAIServer;

      const providerOptions = plugin.aiManager.llmProviders.get(provider);
      if (!providerOptions) {
        ctx.throw(400, 'invalid llm provider');
      }

      const Provider = providerOptions.provider;
      const providerClient = new Provider({
        app: ctx.app,
        serviceOptions: options,
      });

      const res = await providerClient.listModels();
      if (res.errMsg) {
        ctx.log.error(res.errMsg);
        ctx.throw(
          res.code || 500,
          `${ctx.t('Get models list failed, you can enter a model name manually.')} ${res.errMsg}`,
        );
      }
      const models = res.models || [];
      if (model) {
        ctx.body = models.filter((m) => m.id.toLowerCase().includes(model.toLowerCase()));
      } else {
        ctx.body = models;
      }

      return next();
    },
    testFlight: async (ctx, next) => {
      const { provider, options, model } = ctx.action.params.values ?? {};
      const plugin = ctx.app.pm.get('ai') as PluginAIServer;
      const providerOptions = plugin.aiManager.llmProviders.get(provider);
      if (!providerOptions) {
        ctx.throw(400, 'invalid llm provider');
      }
      const Provider = providerOptions.provider;
      const providerClient = new Provider({
        app: ctx.app,
        serviceOptions: options,
        modelOptions: {
          model,
          responseFormat: 'text',
        },
      });
      ctx.body = await providerClient.testFlight();
      return next();
    },

    listAllEnabledModels: async (ctx, next) => {
      const plugin = ctx.app.pm.get('ai') as PluginAIServer;
      const services = await ctx.db.getRepository('llmServices').find({ sort: 'sort' });
      const llmServices = services
        .filter((service) => service.enabled !== false)
        .map((service) => {
          const raw = service.enabledModels;
          let enabledModels: { label: string; value: string }[];

          // Handle new { mode, models } format
          if (raw && typeof raw === 'object' && !Array.isArray(raw) && raw.mode) {
            if (raw.mode === 'recommended') {
              enabledModels = getRecommendedModels(service.provider);
            } else {
              // provider or custom mode
              enabledModels = (raw.models || [])
                .filter((m: { value: string }) => m.value)
                .map((m: { label: string; value: string }) => ({
                  label: m.label || m.value,
                  value: m.value,
                }));
            }
          } else if (Array.isArray(raw)) {
            // Backward compat: old string[] format
            if (raw.length === 0) {
              enabledModels = getRecommendedModels(service.provider);
            } else {
              enabledModels = raw.map((id: string) => ({ label: id, value: id }));
            }
          } else {
            // null/undefined
            enabledModels = getRecommendedModels(service.provider);
          }

          // Skip services with no available models
          if (enabledModels.length === 0) {
            return null;
          }

          const providerMeta = plugin.aiManager.llmProviders.get(service.provider);
          const P = providerMeta.provider;
          const p = new P({ app: ctx.app });
          const isToolConflict = p.isToolConflict();
          return {
            llmService: service.name,
            llmServiceTitle: service.title,
            provider: service.provider,
            providerTitle: providerMeta?.title,
            enabledModels,
            supportWebSearch: providerMeta?.supportWebSearch ?? false,
            isToolConflict,
          };
        })
        .filter(Boolean);

      ctx.body = llmServices;
      await next();
    },
  },
};

export default aiResource;
