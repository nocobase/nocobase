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
import { isViewCollection } from '..';

export default (collection: Collection) => {
  return associationFields(collection)
    .map((field) => {
      if (field.type === 'belongsToMany' || field.type === 'hasMany') {
        return multipleAssociation(collection, field as BelongsToManyField | HasManyField);
      }

      return singleAssociation(collection, field as BelongsToField | HasOneField);
    })
    .reduce((obj, item) => {
      return {
        ...obj,
        ...item,
      };
    }, {});
};

export function associationFields(collection: Collection): Array<RelationField> {
  if (isViewCollection(collection)) {
    return [];
  }

  return Array.from(collection.fields.values())
    .filter((field) => field instanceof RelationField)
    .filter((field) => field.name !== 'createdBy' && field.name !== 'updatedBy');
}
