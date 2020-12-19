import { DataTypes } from 'sequelize';
import { VIRTUAL, VirtualOptions, FieldContext } from '@nocobase/database';

export interface URLOptions extends Omit<VirtualOptions, 'type'> {
  type: 'url';
}

export default class URL extends VIRTUAL {

  constructor({ type, ...options }, context: FieldContext) {
    super({
      ...options,
      type: 'virtual',
      get() {
        const storage = this.getDataValue('storage') || {};
        return `${storage.baseUrl}${this.getDataValue('path')}/${this.getDataValue('id')}${this.getDataValue('extname')}`;
      }
    } as VirtualOptions, context);
  }
}
