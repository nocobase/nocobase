/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type AggregateConfig = {
  aggregator?: string;
  associated?: boolean;
  collection?: string | null;
  association?: AggregateAssociationConfig | null;
  params?: {
    field?: string | null;
    distinct?: boolean;
    filter?: Record<string, unknown> | null;
  };
  precision?: number;
};

export type AggregateAssociationConfig = {
  name?: string;
  associatedKey?: string;
  associatedCollection?: string;
};
