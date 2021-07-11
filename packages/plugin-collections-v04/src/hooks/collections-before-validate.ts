import CollectionModel from '../models/collection';

export default async function (model: CollectionModel) {
  model.generateNameIfNull();
}
