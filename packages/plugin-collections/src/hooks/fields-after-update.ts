import FieldModel from '../models/field';

export default async function (model: FieldModel, options: any = {}) {
  const { migrate = true } = options;
  if (migrate) {
    await model.migrate(options);
  }
  // if (model.get('collection_name') && model.get('parent_id')) {
  //   const parent = await model.getParent({
  //     ...options,
  //   });
  //   const Collection = model.database.getModel('collections');
  //   await Collection.load({...options, where: {name: parent.get('collection_name')}});
  // }
}
