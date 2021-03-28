import { Model, getDataTypeKey, getField } from '@nocobase/database';

export default async function (model: Model, options) {
  //   const { database } = model;
  //   const { type, target, collection_name } = model.get();
  //   const table = database.getTable(collection_name);
  //   const Type = getField(getDataTypeKey(type));
  //   let Exist;
  //   for (const Field of table.getFields().values()) {
  //     if (Field instanceof Type && Field.options.target === target) {
  //       Exist = Field;
  //       break;
  //     }
  //   }
  //   if (Exist) {
  //     model.set('name', Exist.options.name);
  //   }
}
