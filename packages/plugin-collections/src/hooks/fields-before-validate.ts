import { DataTypes } from 'sequelize';

import FieldModel from '../models/field';
import * as types from '../interfaces/types';
import fieldTableOptions from '../collections/fields';

const fieldsMap = new Map();
fieldTableOptions.fields.forEach(field => {
  fieldsMap.set(field.name, field);
});

export default async function (model: FieldModel) {
  const values = model.get();
  if (!values.name) {
    values.name = this.generateName();
  }
  if (values.interface) {
    const { options } = types[values.interface];
    Object.keys(options).forEach(key => {
      if (typeof values[key] === 'undefined') {
        values[key] = options[key];
      }
    });
  }

  model.set(values, { raw: true });
}
