import { Collection } from '@nocobase/database';
import list from './collection';
import associations from './associations';

export default (collection: Collection) => {
  return {
    ...list(collection),
    ...associations(collection),
  };
};

export function hasSortField(collection: Collection) {
  for (const field of collection.fields.values()) {
    if (field.type === 'sort') {
      return true;
    }
  }

  return false;
}
