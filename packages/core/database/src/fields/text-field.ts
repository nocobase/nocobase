/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DataTypes } from 'sequelize';
import { sanitizeRichTextHtml } from '@nocobase/utils';
import { BaseColumnFieldOptions, Field } from './field';

export class TextField extends Field {
  get dataType() {
    if (this.database.inDialect('mysql', 'mariadb') && this.options.length) {
      return DataTypes.TEXT(this.options.length);
    }
    return DataTypes.TEXT;
  }

  init() {
    if (this.database.inDialect('mysql', 'mariadb')) {
      this.options.defaultValue = undefined;
    }
  }

  normalizeValue(value: unknown) {
    const { trim, unique, interface: fieldInterface } = this.options;
    if (unique && value === '') {
      return null;
    }
    if (value == null) {
      return null;
    }
    const stringValue = typeof value === 'string' ? value : String(value);
    const normalizedValue = trim ? stringValue.trim() : stringValue;
    return fieldInterface === 'richText' ? sanitizeRichTextHtml(normalizedValue) : normalizedValue;
  }

  setter(value: unknown) {
    if (this.options.interface !== 'richText' || value == null) {
      return value;
    }
    return sanitizeRichTextHtml(typeof value === 'string' ? value : String(value));
  }

  additionalSequelizeOptions() {
    const { name } = this.options;
    const normalizeValue = (value: unknown) => this.normalizeValue(value);

    return {
      set(value) {
        this.setDataValue(name, normalizeValue(value));
      },
    };
  }
}

export interface TextFieldOptions extends BaseColumnFieldOptions {
  type: 'text';
  length?: 'tiny' | 'medium' | 'long';
  trim?: boolean;
}
