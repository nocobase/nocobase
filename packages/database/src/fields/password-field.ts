import { DataTypes } from 'sequelize';
import { BaseColumnFieldOptions, Field } from './field';
import bcrypt from 'bcrypt';

export interface PasswordFieldOptions extends BaseColumnFieldOptions {
  type: 'password';
}

export class PasswordField extends Field {
  get dataType() {
    return DataTypes.STRING;
  }

  async verify(data: string | Buffer, encrypted: string) {
    return await bcrypt.compare(data, encrypted);
  }

  init() {
    const { name } = this.options;
    this.listener = async (model) => {
      if (!model.changed(name as any)) {
        return;
      }
      const value = model.get(name) as string;
      if (value) {
        if (value.startsWith('$2b$10$') && value.length === 60) {
          return;
        }
        const hash = await bcrypt.hash(value, 10);
        model.set(name, hash);
      } else {
        model.set(name, null);
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
