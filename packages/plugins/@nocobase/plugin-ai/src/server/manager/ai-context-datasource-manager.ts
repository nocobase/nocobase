/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { assign, QueryObject, transformFilter } from '@nocobase/utils';
import { AIContextDatasource } from '../../collections/ai-context-datasource';
import PluginAIServer from '../plugin';
import { WorkContext, WorkContextResolveStrategy } from '../types';
import { Context } from '@nocobase/actions';

export class AIContextDatasourceManager {
  constructor(protected plugin: PluginAIServer) {}
  async preview(ctx: Context, options: PreviewOptions): Promise<QueryResult | null> {
    return await this.innerQuery(ctx, { ...options, filter: options.filter ? transformFilter(options.filter) : null });
  }

  async query(ctx: Context, options: InnerQueryOptions): Promise<QueryResult | null> {
    return await this.innerQuery(ctx, { ...options, filter: options.filter });
  }

  provideWorkContextResolveStrategy(): WorkContextResolveStrategy {
    return async (ctx: Context, contextItem: WorkContext): Promise<string> => {
      if (!contextItem.content) {
        return '';
      }
      const query = contextItem.content as InnerQueryOptions;
      const queryResult = await this.innerQuery(ctx, query);
      return JSON.stringify(queryResult);
    };
  }

  private async innerQuery(ctx: Context, options: InnerQueryOptions): Promise<QueryResult | null> {
    const { datasource, collectionName } = options;
    const resource = collectionName;
    const action = 'list';
    const ds = this.plugin.app.dataSourceManager.get(datasource);
    if (!ds) {
      this.plugin.log.warn(`Datasource ${datasource} not found`);
      return {
        options,
        total: 0,
        records: [],
      };
    }
    const collection = ds.collectionManager.getCollection(collectionName);
    if (!collection) {
      this.plugin.log.warn(`Collection ${collectionName} not found`);
      return {
        options,
        total: 0,
        records: [],
      };
    }

    if (!options?.fields?.length) {
      options.fields = collection
        .getFields()
        .filter((x) => !x.isRelationField())
        .map((x) => x.options.name);
    }

    const skip = await ds.acl.allowManager.isAllowed(resource, action, ctx);
    if (!skip) {
      const roles = ctx.state.currentRoles || ['anonymous'];
      const can = ds.acl.can({ roles, resource, action, rawResourceName: resource });
      if (!can || typeof can !== 'object') {
        return {
          options,
          total: 0,
          records: [],
        };
      }

      const filteredParams = ds.acl.filterParams(ctx, collectionName, can.params);
      const parsedParams = filteredParams ? await ds.acl.parseJsonTemplate(filteredParams, ctx) : {};

      if (parsedParams.appends && options.fields) {
        for (const queryField of options.fields) {
          if (parsedParams.appends.indexOf(queryField) !== -1) {
            // move field to appends
            if (!options.appends) {
              options.appends = [];
            }
            options.appends.push(queryField);
            options.fields = options.fields.filter((f) => f !== queryField);
          }
        }
      }

      assign(options, parsedParams, {
        filter: 'andMerge',
        fields: 'intersect',
        // appends: 'union',
        except: 'union',
        whitelist: 'intersect',
        blacklist: 'intersect',
        // sort: 'overwrite',
        appends: (x, y) => {
          if (!x) {
            return [];
          }
          if (!y) {
            return x;
          }
          return (x as any[]).filter((i) => y.includes(i.split('.').shift()));
        },
      });
    }

    const { fields, filter, sort, offset, limit } = options;
    const result = await collection.repository.find({ fields, filter, sort, offset: offset ?? 0, limit });
    const total = await collection.repository.count({ fields, filter });

    const records = result.map((x) =>
      fields.map((field) => {
        const { name, type } = collection.getField(field)?.options || {};
        const value = x[field];
        return {
          name,
          type,
          value,
        };
      }),
    );

    return {
      options,
      total: total as number,
      records,
    };
  }
}

export type PreviewOptions = Pick<
  AIContextDatasource,
  'datasource' | 'collectionName' | 'fields' | 'appends' | 'filter' | 'sort' | 'limit'
> & { offset?: number };

export type QueryOptions = {
  id: string;
};

export type QueryResult = {
  options: InnerQueryOptions;
  total: number;
  records: {
    name: string;
    type: string;
    value: unknown;
  }[][];
};

type InnerQueryOptions = Omit<PreviewOptions, 'filter'> & {
  filter: QueryObject;
};
