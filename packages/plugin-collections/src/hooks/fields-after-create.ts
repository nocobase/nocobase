import FieldModel from '../models/field';

export default async function (model: FieldModel) {
  // console.log('afterCreate', model.toJSON());
  await model.migrate();
}
