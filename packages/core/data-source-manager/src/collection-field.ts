/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FieldOptions, IField } from './types';

export class CollectionField implements IField {
  options: FieldOptions;

  constructor(options: FieldOptions) {
    this.updateOptions(options);
  }

  updateOptions(options: any) {
    this.options = {
      ...this.options,
      ...options,
    };
  }

  isRelationField(): boolean {
    return false;
  }
}
