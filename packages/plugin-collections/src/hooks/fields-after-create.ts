import FieldModel from '../models/field';

export default async function (model: FieldModel, options: any = {}) {
  const { migrate = true } = options;
  const Collection = model.database.getModel('collections');
  if (model.get('interface') === 'subTable') {
    const target = model.get('target');
    if (target && !model.database.isDefined(target)) {
      await Collection.import({
        name: target,
        internal: true,
        developerMode: true,
      }, options);
    }
  }
  if (migrate) {
    await model.migrate(options);
  }
}
