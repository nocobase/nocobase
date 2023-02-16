import { Repository } from '../repository';
import { BaseValueParser } from './base-value-parser';

export class ToOneValueParser extends BaseValueParser {
  async setValue(value: any) {
    const fieldNames = this.getFileNames();
    const dataIndex = this.ctx?.column?.dataIndex || [];
    if (Array.isArray(dataIndex) && dataIndex.length < 2) {
      return;
    }
    const field = this.ctx.column.dataIndex[1];
    const repository = this.field.database.getRepository(this.field.target) as Repository;
    const instance = await repository.findOne({ filter: { [field]: value.trim() } });
    if (instance) {
      this.value = instance.get(fieldNames.value);
    } else {
      this.errors.push(`"${value}" does not exist`);
    }
  }

  getFileNames() {
    const fieldNames = this.field.options?.uiSchema?.['x-component-props']?.['fieldNames'] || {};
    return { label: 'id', value: 'id', ...fieldNames };
  }

  isInterface(name) {
    return this.field.options.interface === name;
  }
}
