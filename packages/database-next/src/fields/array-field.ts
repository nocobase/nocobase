import { BaseFieldOptions, Field } from './field';
import { DataTypes } from 'sequelize';

export class ArrayField extends Field {
  get dataType() {
    if (this.database.sequelize.getDialect() === 'postgres') {
      return DataTypes.JSONB;
    }

    return DataTypes.JSON;
  }

  sortValue(model) {
    const oldValue = model.get(this.options.name);
    if (oldValue) {
      const newValue = oldValue.sort();
      model.set(this.options.name, newValue);
    }
  }

  bind() {
    super.bind();

    if (this.isSqlite()) {
      this.collection.model.addHook(
        'beforeCreate',
        'array-field-sort',
        this.sortValue.bind(this),
      );
    }
  }

  unbind() {
    super.unbind();
    if (this.isSqlite()) {
      this.collection.model.removeHook('beforeCreate', 'array-field-sort');
    }
  }
}

export interface ArrayFieldOptions extends BaseFieldOptions {
  type: 'array';
}
