/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AIContextDatasource } from '../../collections/ai-context-datasource';
import PluginAIServer from '../plugin';

export class AIContextDatasourceManager {
  constructor(protected plugin: PluginAIServer) {}

  async query({ id }: QueryOptions): Promise<QueryResult | null> {
    const model = await this.plugin.repositories.aiContextDatasources.findById(id);
    if (!model) {
      this.plugin.log.warn(`aiContextDatasources id: ${id} not found`, { id });
      return null;
    }
    const metadata = model.toJSON() as AIContextDatasource;
    const { datasource, collectionName, fields, filter, sort, limit } = metadata;
    const ds = this.plugin.app.dataSourceManager.get(datasource);
    if (!ds) {
      this.plugin.log.warn(`Datasource ${datasource} not found`, { id });
      return {
        metadata,
        records: [],
      };
    }
    const collection = ds.collectionManager.getCollection(collectionName);
    if (!collection) {
      this.plugin.log.warn(`Collection ${collectionName} not found`, { id });
      return {
        metadata,
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
      metadata,
      records,
    };
  }
}

export type QueryOptions = {
  id: string;
};

export type QueryResult = {
  metadata: AIContextDatasource;
  records: {
    name: string;
    type: string;
    value: unknown;
  }[][];
};
