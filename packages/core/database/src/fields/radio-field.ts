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

  listener = async (model, { transaction }) => {
    const { name } = this.options;
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
