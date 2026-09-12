/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const AGGREGATORS = [
  { label: 'COUNT', value: 'count' },
  { label: 'SUM', value: 'sum' },
  { label: 'AVG', value: 'avg' },
  { label: 'MIN', value: 'min' },
  { label: 'MAX', value: 'max' },
] as const;

export const ASSOCIATED_TARGETS = {
  COLLECTION: false,
  ASSOCIATION: true,
} as const;

export const ASSOCIATION_FIELD_TYPES = ['hasMany', 'belongsToMany'] as const;
export const RELATION_FIELD_TYPES = ['belongsTo', 'hasOne', 'hasMany', 'belongsToMany'] as const;
