/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DataTypes } from 'sequelize';
import { BaseColumnFieldOptions, Field } from './field';
import { Model } from '../model';

interface SnowflakeIdGenerator {
  getUniqueID(): BigInt;
}

export class SnowflakeIdField extends Field {
  private static snowflakeIdGenerator: SnowflakeIdGenerator;

  static setSnowflakeIdGenerator(snowflakeIdGenerator: SnowflakeIdGenerator) {
    this.snowflakeIdGenerator = snowflakeIdGenerator;
  }

  get dataType() {
    return DataTypes.BIGINT;
  }

  init() {
    const { name } = this.options;

    this.listener = async (instance: Model) => {
      const value = instance.get(name);

      if (!value) {
        instance.set(name, SnowflakeIdField.snowflakeIdGenerator.getUniqueID().toString());
      }
    };
  }

  bind() {
    super.bind();
    this.on('beforeValidate', this.listener);
    this.on('beforeSave', this.listener);
  }

  unbind() {
    super.unbind();
    this.off('beforeValidate', this.listener);
    this.off('beforeSave', this.listener);
  }
}

export interface SnowflakeIdFieldOptions extends BaseColumnFieldOptions {
  type: 'snowflakeId';
  epoch?: number;
}
