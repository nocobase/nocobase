/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';

export type FieldFormMode = 'create' | 'edit';

export interface FieldConfigureFormProps {
  mode: FieldFormMode;
  fieldInterface: FieldInterfaceConfigureOptions;
  collection?: Record<string, any>;
  field?: Record<string, any>;
  disabledJSONB?: boolean;
  createOnly?: boolean;
  editMainOnly?: boolean;
}

export interface FieldInterfaceConfigureOptions {
  name: string;
  title?: React.ReactNode;
  group?: string;
  order?: number;
  default?: Record<string, any>;
  titleUsable?: boolean;
  isAssociation?: boolean;
  supportDataSourceType?: string[];
  notSupportDataSourceType?: string[];
  ConfigureForm?: React.ComponentType<FieldConfigureFormProps>;
  normalizeValues?: (values: Record<string, any>, context: FieldConfigureFormProps) => Record<string, any>;
}

export class FieldInterfaceConfigureRegistry {
  protected items = new Map<string, FieldInterfaceConfigureOptions>();

  register(options: FieldInterfaceConfigureOptions) {
    this.items.set(options.name, options);
  }

  get(name?: string) {
    if (!name) {
      return undefined;
    }
    return this.items.get(name);
  }

  getAll() {
    return [...this.items.values()].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }
}
