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

export class JsonField extends Field {
  get dataType() {
    const dialect = this.context.database.sequelize.getDialect();
    const { jsonb } = this.options;
    if (dialect === 'postgres' && jsonb) {
      return DataTypes.JSONB;
    }
    return DataTypes.JSON;
  }

  normalizeValue(value: unknown) {
    return this.options.interface === 'richText' && typeof value === 'string' ? sanitizeRichTextHtml(value) : value;
  }

  setter(value: unknown) {
    return this.normalizeValue(value);
  }

  additionalSequelizeOptions() {
    if (this.options.interface !== 'richText') {
      return {};
    }

    const { name, set: originalSetter } = this.options;
    const normalizeValue = (value: unknown) => this.normalizeValue(value);

    return {
      set(value) {
        if (typeof originalSetter === 'function') {
          originalSetter.call(this, normalizeValue(value));
          const currentValue = this.getDataValue(name);
          const normalizedValue = normalizeValue(currentValue);
          if (!Object.is(normalizedValue, currentValue)) {
            this.setDataValue(name, normalizedValue);
          }
          return;
        }
        this.setDataValue(name, normalizeValue(value));
      },
    };
  }
}

export interface JsonFieldOptions extends BaseColumnFieldOptions {
  type: 'json';
}

export class JsonbField extends Field {
  get dataType() {
    const dialect = this.context.database.sequelize.getDialect();
    if (dialect === 'postgres') {
      return DataTypes.JSONB;
    }
    return DataTypes.JSON;
  }
}

export interface JsonbFieldOptions extends BaseColumnFieldOptions {
  type: 'jsonb';
}
