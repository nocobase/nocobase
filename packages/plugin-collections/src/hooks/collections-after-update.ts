import CollectionModel from '../models/collection';

export default async function (model: CollectionModel, options: any = {}) {
  const { migrate = true } = options;
  if (migrate) {
    await model.migrate(options);
  }
}
