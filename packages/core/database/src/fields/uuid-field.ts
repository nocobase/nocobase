import { DataTypes } from 'sequelize';
import { BaseColumnFieldOptions, Field } from './field';
import { v4 as uuidv4 } from 'uuid';

export class UuidField extends Field {
  get dataType() {
    return DataTypes.UUID;
  }

  init() {
    const { name, autoFill } = this.options;

    this.listener = async (instance) => {
      const value = instance.get(name);

      if (!value && autoFill !== false) {
        instance.set(name, uuidv4());
      }
    };
  }

  bind() {
    super.bind();
    this.on('beforeCreate', this.listener);
    this.on('beforeUpdate', this.listener);
  }

  unbind() {
    super.unbind();
    this.off('beforeCreate', this.listener);
    this.off('beforeUpdate', this.listener);
  }
}

export interface UUIDFieldOptions extends BaseColumnFieldOptions {
  type: 'uuid';
  autoFill?: boolean;
}
