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
import { getRecommendedModels } from '../../shared/recommended-models';

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
    checkLLMConfigured: async (ctx, next) => {
      const count = await ctx.db.getRepository('llmServices').count();
      ctx.body = { configured: count > 0 };
      await next();
    },
    listAllEnabledModels: async (ctx, next) => {
      const services = await ctx.db.getRepository('llmServices').find();
      const llmServices = services
        .map((service) => {
          let models: string[] = service.enabledModels || [];

          // If enabledModels is empty and useRecommended is true, use recommended models
          if (models.length === 0 && service.useRecommended !== false) {
            models = getRecommendedModels(service.provider);
          }

          // Skip services with no available models
          if (models.length === 0) {
            return null;
          }

          return {
            llmService: service.name,
            llmServiceTitle: service.title,
            provider: service.provider,
            enabledModels: models.map((id: string) => ({
              id,
              label: id,
            })),
            isAutoMode: (service.enabledModels || []).length === 0,
          };
        })
        .filter(Boolean);

      ctx.body = llmServices;
      await next();
    },
    setRuntimeContext: async (ctx, next) => {
      const plugin = ctx.app.pm.get('ai') as PluginAIServer;
      const { apis, envs } = ctx.action.params.values ?? {};

      if (!apis && !envs) {
        ctx.throw(400, 'Missing runtime context data (apis or envs)');
      }

      plugin.skillManager.setContextData({ apis, envs });

      ctx.body = {
        success: true,
        message: 'Runtime context data set successfully',
      };

      return next();
    },
  },
};

export default aiResource;
