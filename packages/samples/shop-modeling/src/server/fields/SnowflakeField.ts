import { DataTypes } from 'sequelize';
// 引入算法工具包
import { Snowflake } from 'nodejs-snowflake';
// 引入字段类型基类
import { Field, BaseColumnFieldOptions } from '@nocobase/database';

export interface SnowflakeFieldOptions extends BaseColumnFieldOptions {
  epoch: number;
  instanceId: number;
}

export class SnowflakeField extends Field {
  get dataType() {
    return DataTypes.BIGINT;
  }

  initialize() {
    const {
      epoch: custom_epoch = Date.now(),
      instanceId: instance_id = process.env.INSTANCE_ID ? Number.parseInt(process.env.INSTANCE_ID) : 0,
    } = this.options;
    this.generator = new Snowflake({ custom_epoch, instance_id });
  }

  setValue = (instance) => {
    const { name } = this.options;
    instance.set(name, this.generator.getUniqueID());
  };

  bind() {
    super.bind();
    this.on('beforeCreate', this.setValue);
  }

  unbind() {
    super.unbind();
    this.off('beforeCreate', this.setValue);
  }
}

export default SnowflakeField;
