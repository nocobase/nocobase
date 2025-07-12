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
    listModels: async (ctx, next) => {
      const { llmService } = ctx.action.params;
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
      const res = await provider.listModels();
      if (res.errMsg) {
        ctx.log.error(res.errMsg);
        ctx.throw(500, ctx.t('Get models list failed, you can enter a model name manually.'));
      }
      ctx.body = res.models || [];
      return next();
    },

    defineCollections: async (ctx, next) => {
      const { collections } = ctx.action.params.values || {};
      const id = {
        name: 'id',
        type: 'bigInt',
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
        uiSchema: {
          type: 'number',
          title: '{{t("ID")}}',
          'x-component': 'InputNumber',
          'x-read-pretty': true,
        },
        interface: 'integer',
      };
      const createdAt = {
        name: 'createdAt',
        interface: 'createdAt',
        type: 'date',
        field: 'createdAt',
        uiSchema: {
          type: 'datetime',
          title: '{{t("Created at")}}',
          'x-component': 'DatePicker',
          'x-component-props': {},
          'x-read-pretty': true,
        },
      };
      const updatedAt = {
        type: 'date',
        field: 'updatedAt',
        name: 'updatedAt',
        interface: 'updatedAt',
        uiSchema: {
          type: 'datetime',
          title: '{{t("Last updated at")}}',
          'x-component': 'DatePicker',
          'x-component-props': {},
          'x-read-pretty': true,
        },
      };
      for (const options of collections) {
        if (options.name === 'users') {
          continue;
        }
        if (options.autoGenId !== false && !options.isThrough) {
          options.autoGenId = false;
          options.fields.unshift(id);
        }
        if (options.createdAt !== false) {
          options.fields.push(createdAt);
        }
        if (options.updatedAt !== false) {
          options.fields.push(updatedAt);
        }
        const primaryKey = options.fields.find((field: any) => field.primaryKey);
        if (!options.filterTargetKey) {
          options.filterTargetKey = primaryKey?.name || 'id';
        }
        // omit defaultValue
        options.fields = options.fields.map((field: any) => {
          return _.omit(field, ['defaultValue']);
        });
        const transaction = await ctx.app.db.sequelize.transaction();
        try {
          const repo = ctx.db.getRepository('collections');
          const collection = await repo.findOne({
            filter: {
              name: options.name,
            },
            transaction,
          });
          if (!collection) {
            const collection = await repo.create({
              values: options,
              transaction,
              context: ctx,
            });
            // await collection.load({ transaction });
            await transaction.commit();
            continue;
          }
          await repo.update({
            filterByTk: collection.name,
            values: {
              ...options,
              fields: options.fields?.map((f: any) => {
                delete f.key;
                return f;
              }),
            },
            updateAssociationValues: ['fields'],
            transaction,
          });
          await collection.loadFields({
            transaction,
          });
          await collection.load({ transaction, resetFields: true });
          await transaction.commit();
        } catch (e) {
          await transaction.rollback();
          throw e;
        }
      }

      await next();
    },
  },
};

export default aiResource;
