import { DataTypes } from 'sequelize';
import { BaseColumnFieldOptions, Field } from './field';

export interface RadioFieldOptions extends BaseColumnFieldOptions {
  type: 'radio';
}

/**
 * 暂时只支持全局，不支持批量
 */
export class RadioField extends Field {
  get dataType() {
    return DataTypes.BOOLEAN;
  }

  init() {
    const { name } = this.options;
    this.listener = async (model, { transaction }) => {
      if (!model.changed(name as any)) {
        return;
      }
      const value = model.get(name) as boolean;
      if (value) {
        const M = this.collection.model;
        await M.update(
          { [name]: false },
          {
            where: {
              [name]: true,
            },
            transaction,
            hooks: false,
          },
        );
      }
    };
  }

  bind() {
    super.bind();
    this.on('beforeCreate', this.listener.bind(this));
    this.on('beforeUpdate', this.listener.bind(this));
  }

  unbind() {
    super.unbind();
    this.off('beforeCreate', this.listener.bind(this));
    this.off('beforeUpdate', this.listener.bind(this));
  }
}
