import CollectionModel from '../models/collection';

export default async function (model: CollectionModel) {
  await model.migrate();
}
