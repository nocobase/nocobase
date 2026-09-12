/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { cloneDeep, merge } from 'lodash';
import type { ReactNode } from 'react';

export interface CollectionTemplateFieldOption {
  label: ReactNode;
  value: string | number | boolean;
  [key: string]: unknown;
}

export interface CollectionTemplateField {
  name: string;
  interface?: string;
  type?: string;
  title?: ReactNode;
  options?: CollectionTemplateFieldOption[];
  component?: string;
  componentProps?: Record<string, unknown>;
  uiSchema?: Record<string, unknown>;
  [key: string]: unknown;
}

interface FieldInterfaceConfigureLike {
  default?: {
    uiSchema?: Record<string, unknown>;
    [key: string]: unknown;
  };
}

interface FieldInterfaceLike {
  default?: {
    uiSchema?: Record<string, unknown>;
    [key: string]: unknown;
  };
}

export interface CollectionTemplateFieldNormalizeManager {
  getFieldInterfaceConfigure?: (
    name: string,
    collectionInfo?: Record<string, unknown>,
  ) => FieldInterfaceConfigureLike | undefined;
  getFieldInterface?: (name: string) => FieldInterfaceLike | undefined;
}

export interface NormalizeCollectionTemplateFieldOptions {
  collectionInfo?: Record<string, unknown>;
}

export function normalizeCollectionTemplateField(
  field: CollectionTemplateField,
  manager?: CollectionTemplateFieldNormalizeManager,
  options: NormalizeCollectionTemplateFieldOptions = {},
) {
  const fieldInterfaceName = field.interface;
  const fieldInterfaceDefault = fieldInterfaceName
    ? manager?.getFieldInterfaceConfigure?.(fieldInterfaceName, options.collectionInfo)?.default ||
      manager?.getFieldInterface?.(fieldInterfaceName)?.default
    : undefined;

  const normalized = merge({}, cloneDeep(fieldInterfaceDefault || {}), cloneDeep(field));
  const uiSchema = merge({}, cloneDeep(fieldInterfaceDefault?.uiSchema || {}), cloneDeep(field.uiSchema || {}));

  if (field.title !== undefined) {
    uiSchema.title = field.title;
  }

  if (field.options !== undefined) {
    uiSchema.enum = cloneDeep(field.options);
  }

  if (field.component !== undefined) {
    uiSchema['x-component'] = field.component;
  }

  if (field.componentProps !== undefined) {
    uiSchema['x-component-props'] = merge(
      {},
      cloneDeep(fieldInterfaceDefault?.uiSchema?.['x-component-props'] || {}),
      cloneDeep(field.componentProps),
    );
  }

  delete normalized.title;
  delete normalized.options;
  delete normalized.component;
  delete normalized.componentProps;

  if (Object.keys(uiSchema).length) {
    normalized.uiSchema = uiSchema;
  }

  return normalized;
}

export function normalizeCollectionTemplateFields(
  fields: CollectionTemplateField[] = [],
  manager?: CollectionTemplateFieldNormalizeManager,
  options?: NormalizeCollectionTemplateFieldOptions,
) {
  return fields.map((field) => normalizeCollectionTemplateField(field, manager, options));
}
