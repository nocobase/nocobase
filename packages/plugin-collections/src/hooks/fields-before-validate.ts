import FieldModel from '../models/field';
import * as types from '../interfaces/types';
import _ from 'lodash';

export default async function (model: FieldModel) {
  model.generateNameIfNull();
  if (model.get('interface')) {
    model.setInterface(model.get('interface'));
  }
}
