/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { CollectionTriggerField } from '@nocobase/plugin-workflow/client-v2';
import { ASSOCIATION_FIELD_TYPES, RELATION_FIELD_TYPES } from './constants';
import type { AggregateAssociationConfig } from './types';

export function matchToManyField(field: CollectionTriggerField): boolean {
  return ASSOCIATION_FIELD_TYPES.includes(field.type as (typeof ASSOCIATION_FIELD_TYPES)[number]);
}

export function isAggregateValueField(field: CollectionTriggerField): boolean {
  return Boolean(
    !field.hidden &&
      field.interface &&
      !RELATION_FIELD_TYPES.includes(field.type as (typeof RELATION_FIELD_TYPES)[number]),
  );
}

export function getAssociatedPath(value?: AggregateAssociationConfig | null): string[] {
  const { associatedKey = '', name: fieldName } = value ?? {};
  const matched = associatedKey.match(/^{{(.*)}}$/);
  if (!matched || !fieldName) {
    return [];
  }

  return [...matched[1].trim().split('.').slice(0, -1), fieldName].filter(Boolean);
}
