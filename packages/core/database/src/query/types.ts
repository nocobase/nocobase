/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type QueryField = string | string[];

export interface QueryMeasure {
  field: QueryField;
  type?: string;
  aggregation?: string;
  alias?: string;
  distinct?: boolean;
}

export interface QueryDimension {
  field: QueryField;
  type?: string;
  alias?: string;
  format?: string;
  options?: any;
}

export interface QueryOrder {
  field: QueryField;
  alias?: string;
  order?: 'asc' | 'desc';
  nulls?: 'default' | 'first' | 'last';
}

export interface QueryOptions {
  measures?: QueryMeasure[];
  dimensions?: QueryDimension[];
  orders?: QueryOrder[];
  filter?: any;
  having?: any;
  limit?: number;
  offset?: number;
  timezone?: string;
  context?: any;
}
