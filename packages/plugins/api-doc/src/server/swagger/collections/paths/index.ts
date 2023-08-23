import { Collection } from '@nocobase/database';
import list from './collection';
import associations from './associations';

export default (collection: Collection, options) => {
  const paths = list(collection);

  if (options.withAssociation) {
    Object.assign(paths, associations(collection));
  }

  return paths;
};

export function hasSortField(collection: Collection) {
  for (const field of collection.fields.values()) {
    if (field.type === 'sort') {
      return true;
    }
  }

  return false;
}
