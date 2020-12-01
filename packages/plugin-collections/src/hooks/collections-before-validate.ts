import CollectionModel from '../models/collection';

export default async function (model: CollectionModel) {
  if (!model.get('name')) {
    model.setDataValue('name', this.generateName());
  }
}
