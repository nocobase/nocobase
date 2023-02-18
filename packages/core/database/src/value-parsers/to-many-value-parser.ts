import { basename, extname } from 'path';
import { Repository } from '../repository';
import { BaseValueParser } from './base-value-parser';

export class ToManyValueParser extends BaseValueParser {
  async setValue(value: any) {
    const fieldNames = this.getFileNames();
    // attachment
    if (this.isInterface('attachment')) {
      this.value = this.toArr(value).map((url: string) => {
        return {
          title: basename(url),
          extname: extname(url),
          filename: basename(url),
          url,
        };
      });
    }
    // china region
    else if (this.isInterface('chinaRegion')) {
      const repository = this.field.database.getRepository(this.field.target) as Repository;
      try {
        this.value = await Promise.all(
          this.toArr(value, '/').map(async (v) => {
            const instance = await repository.findOne({ filter: { [fieldNames.label]: v.trim() } });
            if (!instance) {
              throw new Error(`"${v}" does not exist`);
            }
            return instance.get(fieldNames.value);
          }),
        );
      } catch (error) {
        this.errors.push(error.message);
      }
    }
    else {
      const dataIndex = this.ctx?.column?.dataIndex || [];
      if (Array.isArray(dataIndex) && dataIndex.length < 2) {
        this.errors.push(`data index invalid`);
        return;
      }
      const key = this.ctx.column.dataIndex[1];
      const repository = this.field.database.getRepository(this.field.target) as Repository;
      try {
        this.value = await Promise.all(
          this.toArr(value).map(async (v) => {
            const instance = await repository.findOne({ filter: { [key]: v.trim() } });
            if (!instance) {
              throw new Error(`"${v}" does not exist`);
            }
            return instance.get(fieldNames.value);
          }),
        );
      } catch (error) {
        this.errors.push(error.message);
      }
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
