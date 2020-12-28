import FieldModel from '../models/field';
import { BELONGSTO, BELONGSTOMANY, HASMANY } from '@nocobase/database';

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
  await model.generatePairField(options);
}
