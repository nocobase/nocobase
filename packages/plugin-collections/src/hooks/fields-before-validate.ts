import FieldModel from '../models/field';
import _ from 'lodash';

export default async function (model: FieldModel, options) {
  // 生成随机 name 要放最后
  // model.generateNameIfNull();
  // 如果 collection_name 不存在
  if (!model.get('collection_name') && model.get('parent_id')) {
    const parent = await model.getParent({
      ...options,
    });
    const target = parent.get('target');
    if (target) {
      model.set('collection_name', target);
    }
  }
}
