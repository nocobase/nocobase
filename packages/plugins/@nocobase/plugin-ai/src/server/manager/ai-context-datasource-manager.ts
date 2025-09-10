/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { QueryObject, transformFilter } from '@nocobase/utils';
import { AIContextDatasource } from '../../collections/ai-context-datasource';
import PluginAIServer from '../plugin';
import { WorkContext } from '../types';

export class AIContextDatasourceManager {
  constructor(protected plugin: PluginAIServer) {}
  async preview(options: PreviewOptions): Promise<QueryResult | null> {
    return await this.innerQuery({ ...options, filter: options.filter ? transformFilter(options.filter) : null });
  }

  async query({ id }: QueryOptions): Promise<QueryResult | null> {
    const model = await this.plugin.repositories.aiContextDatasources.findById(id);
    if (!model) {
      this.plugin.log.warn(`aiContextDatasources id: ${id} not found`, { id });
      return null;
    }
    const metadata = model.toJSON() as AIContextDatasource;
    return await this.innerQuery({ ...metadata, filter: metadata.filter ? transformFilter(metadata.filter) : null });
  }

  provideWorkContextResolveStrategy() {
    return async (contextItem: WorkContext): Promise<string> => {
      if (!contextItem.content) {
        return '';
      }
      const query = contextItem.content as InnerQueryOptions;
      const queryResult = await this.innerQuery(query);
      return JSON.stringify(queryResult);
    };
  }

  private async innerQuery(options: InnerQueryOptions): Promise<QueryResult | null> {
    const { datasource, collectionName, fields, filter, sort, limit } = options;
    const ds = this.plugin.app.dataSourceManager.get(datasource);
    if (!ds) {
      this.plugin.log.warn(`Datasource ${datasource} not found`);
      return {
        options,
        records: [],
      };
    }
    const collection = ds.collectionManager.getCollection(collectionName);
    if (!collection) {
      this.plugin.log.warn(`Collection ${collectionName} not found`);
      return {
        options,
        records: [],
      };
    }
    let targetFields = fields;
    if (!targetFields?.length) {
      targetFields = collection
        .getFields()
        .filter((x) => !x.isRelationField())
        .map((x) => x.options.name);
    }

    const result = await collection.repository.find({ fields, filter, sort, limit });

    const records = result.map((x) =>
      targetFields.map((field) => {
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
      records,
    };
  }
}

export type PreviewOptions = Pick<
  AIContextDatasource,
  'datasource' | 'collectionName' | 'fields' | 'filter' | 'sort' | 'limit'
>;

export type QueryOptions = {
  id: string;
};

export type QueryResult = {
  options: InnerQueryOptions;
  records: {
    name: string;
    type: string;
    value: unknown;
  }[][];
};

type InnerQueryOptions = Omit<PreviewOptions, 'filter'> & {
  filter: QueryObject;
};
