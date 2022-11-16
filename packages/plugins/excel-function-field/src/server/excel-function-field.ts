import { BaseFieldOptions, Field } from '@nocobase/database';
import { DataTypes } from 'sequelize';
import { getHotExcelParser } from '../utils/getHotExcelParser';

export class ExcelFunctionField extends Field {
  get dataType() {
    return DataTypes.STRING;
  }

  caculate(expression, scope) {
    let result = null;
    let parser = getHotExcelParser(scope)
    try {
      let response = parser.parse(expression);
      if (!response?.error) {
        result = response.result;
      }
    } catch {}
    return result;
  }

  initFieldData = async ({ transaction }) => {
    const { expression, name } = this.options;

    const records = await this.collection.repository.find({
      order: [this.collection.model.primaryKeyAttribute],
      transaction,
    });

    for (const record of records) {
      const scope = record.toJSON();
      const result = this.caculate(expression, scope);
      if (result) {
        await record.update(
          {
            [name]: result,
          },
          {
            transaction,
            silent: true,
            hooks: false,
          },
        );
      }
    }
  };

  caculateField = async (instance) => {
    const { expression, name } = this.options;
    const scope = instance.toJSON();
    let result;
    let parser = getHotExcelParser(scope)
    try {
      let response = parser.parse(expression);
      if (!response?.error) {
        result = response.result;
      }
    } catch {}
    if (result) {
      instance.set(name, result);
    }
  };

  updateFieldData = async (instance, { transaction }) => {
    if (this.collection.name === instance.collectionName && instance.name === this.options.name) {
      this.options = Object.assign(this.options, instance.options);
      const { name, expression } = this.options;

      const records = await this.collection.repository.find({
        order: [this.collection.model.primaryKeyAttribute],
        transaction,
      });

      for (const record of records) {
        const scope = record.toJSON();
        const result = this.caculate(expression, scope);
        await record.update(
          {
            [name]: result,
          },
          {
            transaction,
            silent: true,
            hooks: false,
          },
        );
      }
    }
  };

  bind() {
    super.bind();
    this.on('afterSync', this.initFieldData);
    // TODO: should not depends on fields table (which is defined by other plugin)
    this.database.on('fields.afterUpdate', this.updateFieldData);
    this.on('beforeSave', this.caculateField);
  }

  unbind() {
    super.unbind();
    this.off('beforeSave', this.caculateField);
    // TODO: should not depends on fields table
    this.database.off('fields.afterUpdate', this.updateFieldData);
    this.off('afterSync', this.initFieldData);
  }
}

export interface ExcelFunctionFieldOptions extends BaseFieldOptions {
  type: 'excelFunction';
  expression: string;
}
