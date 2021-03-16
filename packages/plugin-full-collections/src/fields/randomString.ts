import cryptoRandomString from 'crypto-random-string';
import { STRING, FieldContext } from '@nocobase/database';
import {
  DataTypes
} from 'sequelize';

export class RANDOMSTRING extends STRING {
  constructor(options: any, context: FieldContext) {
    super(options, context);
    const Model = context.sourceTable.getModel();
    const { name, randomString } = options;
    randomString && Model.addHook('beforeValidate', (model) => {
      const { template, ...opts } = randomString;
      let value = cryptoRandomString(opts);
      if (template && template.includes('%r')) {
        value = template.replace('%r', value);
      }
      if (!model.get(name)) {
        model.set(name, value);
      }
    });
  }

  getDataType() {
    return DataTypes.STRING;
  }
}
