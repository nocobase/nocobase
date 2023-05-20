import { DataTypes } from 'sequelize';
import type { BaseColumnFieldOptions} from './field';
import { Field } from './field';

export class ArrayField extends Field {
  get dataType() {
    if (this.database.sequelize.getDialect() === 'postgres') {
      return DataTypes.JSONB;
    }

    return DataTypes.JSON;
  }

  sortValue = (model) => {
    const oldValue = model.get(this.options.name);

    if (oldValue) {
      const newValue = oldValue.sort();
      model.set(this.options.name, newValue);
    }
  };

  bind() {
    super.bind();
    this.on('beforeSave', this.sortValue);
  }

  unbind() {
    super.unbind();
    this.off('beforeSave', this.sortValue);
  }
}

export interface ArrayFieldOptions extends BaseColumnFieldOptions {
  type: 'array';
}
