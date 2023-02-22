import { basename, extname } from 'path';
import { Repository } from '../repository';
import { BaseValueParser } from './base-value-parser';

export class ToManyValueParser extends BaseValueParser {
  setAccessors = {
    attachment: 'setAttachments',
    chinaRegion: 'setChinaRegion',
  };

  async setAttachments(value: any) {
    this.value = this.toArr(value).map((url: string) => {
      return {
        title: basename(url),
        extname: extname(url),
        filename: basename(url),
        url,
      };
    });
  }

  async setChinaRegion(value: any) {
    const repository = this.field.database.getRepository(this.field.target) as Repository;
    try {
      const values = [];
      const names = this.toArr(value, '/');
      let parentCode = null;
      for (const name of names) {
        const instance = await repository.findOne({
          filter: {
            name: name.trim(),
            parentCode,
          },
        });
        if (!instance) {
          throw new Error(`"${value}" does not exist`);
        }
        parentCode = instance.get('code');
        values.push(parentCode);
      }
      if (values.length !== names.length) {
        throw new Error(`"${value}" does not exist`);
      }
      this.value = values;
    } catch (error) {
      this.errors.push(error.message);
    }
  }

  async setAssociations(value: any) {
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
          const instance = await repository.findOne({ filter: { [key]: v } });
          if (!instance) {
            throw new Error(`"${v}" does not exist`);
          }
          return instance.get(this.field.targetKey || 'id');
        }),
      );
    } catch (error) {
      this.errors.push(error.message);
    }
  }

  async setValue(value: any) {
    const setAccessor = this.setAccessors[this.getInterface()] || 'setAssociations';
    await this[setAccessor](value);
  }

  getInterface() {
    return this.field?.options?.interface as string;
  }

  isInterface(name: string) {
    return this.getInterface() === name;
  }
}
