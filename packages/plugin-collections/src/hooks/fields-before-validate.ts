import FieldModel from '../models/field';
import * as types from '../interfaces/types';

export default async function (model: FieldModel) {
  if (!model.get('name')) {
    model.setDataValue('name', this.generateName());
  }
  if (model.get('interface')) {
    const { options } = types[model.get('interface')];
    Object.keys(options).forEach(key => {
      if (!model.get(key)) {
        model.setDataValue(key, options[key]);
      }
    });
  }
}
