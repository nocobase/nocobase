import { DataTypes } from 'sequelize';
import { BaseColumnFieldOptions, Field, ValueParser } from './field';

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

  buildValueParser(ctx: any) {
    return new ArrayValueParser(this, ctx);
  }
}

export class ArrayValueParser extends ValueParser {
  async setValue(value: any) {
    const { map, set } = this.getOptions();
    const values = this.toArr(value);
    if (set.size > 0) {
      const filtered = values.map((v) => (map.has(v) ? map.get(v) : v)).filter((v) => set.has(v));
      if (values.length === filtered.length) {
        this.value = filtered;
      } else {
        this.errors.push('No matching option found');
      }
    } else {
      this.value = values;
    }
  }

  getOptions() {
    const options = this.field.options?.['uiSchema']?.enum || [];
    const map = new Map();
    const set = new Set();
    for (const option of options) {
      set.add(option.value);
      set.add(option.label);
      map.set(option.label, option.value);
    }
    return { map, set };
  }

  toArr(value) {
    let values = [];
    if (!value) {
      values = [];
    } else if (typeof value === 'string') {
      values = value.split(',');
    } else if (Array.isArray(value)) {
      values = value;
    }
    return values;
  }
}

export interface ArrayFieldOptions extends BaseColumnFieldOptions {
  type: 'array';
}
