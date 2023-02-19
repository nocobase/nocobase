import { Repository } from '../repository';
import { BaseValueParser } from './base-value-parser';

export class ToOneValueParser extends BaseValueParser {
  async setValue(value: any) {
    const dataIndex = this.ctx?.column?.dataIndex || [];
    if (Array.isArray(dataIndex) && dataIndex.length < 2) {
      this.errors.push(`data index invalid`);
      return;
    }
    const key = this.ctx.column.dataIndex[1];
    const repository = this.field.database.getRepository(this.field.target) as Repository;
    const instance = await repository.findOne({ filter: { [key]: this.trim(value) } });
    if (instance) {
      this.value = instance.get(this.field.targetKey || 'id');
    } else {
      this.errors.push(`"${value}" does not exist`);
    }
  }
}
