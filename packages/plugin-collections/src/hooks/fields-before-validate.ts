import FieldModel from '../models/field';
import _ from 'lodash';

export default async function (model: FieldModel, options) {
  // 生成随机 name 要放最后
  // model.generateNameIfNull();
  const Collection = model.database.getModel('collections');
  if (model.get('interface') === 'subTable') {
    const target = model.get('target');
    if (target) {
      const collection = await Collection.findOne({
        ...options,
        where: {
          name: target,
        },
      });
      if (!collection) {
        await Collection.create({
          name: target,
          internal: true,
          developerMode: true,
        }, options);
      }
      await Collection.load({...options, where: {name: model.get('name')}})
    }
  }
  // 如果 collection_name 不存在
  if (!model.get('collection_name') && model.get('parent_id')) {
    const parent = await model.getParent({
      ...options,
    });
    const target = parent.get('target');
    if (target) {
      const collection = await Collection.findOne({
        ...options,
        where: {
          name: target,
        },
      });
      if (!collection) {
        await Collection.create({
          name: target,
          internal: true,
          developerMode: true,
        }, options);
      }
      await Collection.load({...options, where: {name: parent.get('name')}})
      model.set('collection_name', target);
    }
  }
}
