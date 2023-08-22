import {
  BelongsToField,
  BelongsToManyField,
  Collection,
  HasManyField,
  HasOneField,
  RelationField,
} from '@nocobase/database';
import multipleAssociation from './multiple-association';
import singleAssociation from './single-association';

export default (collection: Collection) => {
  return associationFields(collection)
    .map((field) => {
      console.log({
        fieldName: field.name,
        fieldType: field.type,
      });
      if (field.type === 'belongsToMany' || field.type === 'hasMany') {
        return multipleAssociation(collection, field as BelongsToManyField | HasManyField);
      }

      return singleAssociation(collection, field as BelongsToField | HasOneField);
    })
    .reduce((obj, item) => {
      console.log({ item });
      return {
        ...obj,
        ...item,
      };
    }, {});
};

export function associationFields(collection: Collection): Array<RelationField> {
  return Array.from(collection.fields.values()).filter((field) => field instanceof RelationField);
}
