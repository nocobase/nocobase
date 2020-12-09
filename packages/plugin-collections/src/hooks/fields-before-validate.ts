import FieldModel from '../models/field';
import * as types from '../interfaces/types';
import _ from 'lodash';

export default async function (model: FieldModel) {
  // if (model.get('interface')) {
  //   model.setInterface(model.get('interface'));
  // }
  // 生成随机 name 要放最后
  model.generateNameIfNull();
}
