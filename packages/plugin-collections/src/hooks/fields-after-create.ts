import FieldModel from '../models/field';

export default async function (model: FieldModel, options: any = {}) {
  const { migrate = true } = options;
  if (migrate) {
    await model.migrate(options);
  }
}
