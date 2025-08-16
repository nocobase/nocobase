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
          ctx.throw(500, ctx.t('Get models list failed, you can enter a model name manually.'));
        }
        ctx.body = res.models || [];
      }

      return next();
    },
  },
};

export default aiResource;
