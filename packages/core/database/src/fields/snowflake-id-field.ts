import { BaseColumnFieldOptions, Field } from './field';
import { DataTypes } from 'sequelize';
import { Snowflake } from '@theinternetfolks/snowflake';

export class SnowflakeIdField extends Field {
  get dataType() {
    return DataTypes.BIGINT;
  }

  init() {
    const { name, autoFill } = this.options;

    this.listener = async (instance) => {
      const value = instance.get(name);

      if (!value && autoFill !== false) {
        instance.set(name, Snowflake.generate());
      }
    };
  }

  bind() {
    super.bind();
    // https://sequelize.org/docs/v6/other-topics/hooks/
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
  autoFill?: boolean;
}
