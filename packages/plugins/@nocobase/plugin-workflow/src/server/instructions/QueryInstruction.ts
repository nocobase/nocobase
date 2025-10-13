/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DEFAULT_PAGE, DEFAULT_PER_PAGE, utils } from '@nocobase/actions';
import { parseCollectionName } from '@nocobase/data-source-manager';

import type Processor from '../Processor';
import { JOB_STATUS } from '../constants';
import type { FlowNodeModel } from '../types';
import { toJSON } from '../utils';
import { Instruction } from '.';

type QueryParams = {
  filter?: Record<string, any>;
  sort?: { field: string; direction: 'ASC' | 'DESC' }[];
  page?: number;
  pageSize?: number;
  appends?: string[];
};

type QueryInstructionConfig = {
  collection: string;
  multiple: boolean;
  params?: QueryParams;
  noPagenation?: boolean;
  failOnEmpty?: boolean;
};

export class QueryInstruction extends Instruction {
  async run(node: FlowNodeModel, input, processor: Processor) {
    const { collection, multiple, params = {}, noPagenation = false, failOnEmpty = false } = node.config;
    const [dataSourceName] = parseCollectionName(collection);

    return this.execute({
      collection,
      multiple,
      params: processor.getParsedValue(params, node.id),
      noPagenation,
      failOnEmpty,
      transaction: this.workflow.useDataSourceTransaction(dataSourceName, processor.transaction),
    });
  }

  async test({ collection, multiple, params = {}, noPagenation = false, failOnEmpty = false }: QueryInstructionConfig) {
    return this.execute({ collection, multiple, params, noPagenation, failOnEmpty });
  }

  private async execute({
    collection,
    multiple,
    params = {},
    noPagenation = false,
    failOnEmpty = false,
    transaction,
  }: QueryInstructionConfig & { transaction?: any }) {
    const [dataSourceName, collectionName] = parseCollectionName(collection);

    const { repository } = this.workflow.app.dataSourceManager.dataSources
      .get(dataSourceName)
      .collectionManager.getCollection(collectionName);

    const { page, pageSize, sort = [], ...options } = params;
    const sortParams = Array.isArray(sort) ? sort : [];
    const appends = options.appends
      ? Array.from(
          options.appends.reduce((set, field) => {
            set.add(field.split('.')[0]);
            set.add(field);
            return set;
          }, new Set()),
        )
      : options.appends;

    const result = await (multiple ? repository.find : repository.findOne).call(repository, {
      ...options,
      ...(noPagenation ? {} : utils.pageArgsToLimitArgs(page ?? DEFAULT_PAGE, pageSize ?? DEFAULT_PER_PAGE)),
      sort: sortParams
        .filter((item) => item.field)
        .map((item) => `${item.direction?.toLowerCase() === 'desc' ? '-' : ''}${item.field}`),
      appends,
      transaction,
    });

    if (failOnEmpty && (multiple ? !result.length : !result)) {
      return {
        result,
        status: JOB_STATUS.FAILED,
      };
    }

    // NOTE: `toJSON()` to avoid getting undefined value from Proxied model instance (#380)
    // e.g. Object.prototype.hasOwnProperty.call(result, 'id') // false
    // so the properties can not be get by json-templates(object-path)
    return {
      result: toJSON(result),
      status: JOB_STATUS.RESOLVED,
    };
  }
}

export default QueryInstruction;
