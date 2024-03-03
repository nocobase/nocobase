import { DataTypes } from 'sequelize';
import { BaseColumnFieldOptions, Field } from './field';

export class DateField extends Field {
  get dataType() {
    return DataTypes.DATE(3);
  }

  get timezone() {
    return this.isGMT() ? '+00:00' : null;
  }

  getProps() {
    return this.options?.uiSchema?.['x-component-props'] || {};
  }

  isDateOnly() {
    const props = this.getProps();
    return !props.showTime;
  }

  isGMT() {
    const props = this.getProps();
    return props.gmt;
  }

  bind() {
    super.bind();

    if (this.options.interface === 'createdAt') {
      const { model } = this.context.collection;
      // @ts-ignore
      model._timestampAttributes.createdAt = this.name;
      // @ts-ignore
      model.refreshAttributes();
    }

    if (this.options.interface === 'updatedAt') {
      const { model } = this.context.collection;
      // @ts-ignore
      model._timestampAttributes.updatedAt = this.name;
      // @ts-ignore
      model.refreshAttributes();
    }
  }
}

export interface DateFieldOptions extends BaseColumnFieldOptions {
  type: 'date';
}
