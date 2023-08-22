import { Collection } from '@nocobase/database';
import list from './list';
import associations from './associations';

export default (collection: Collection) => {
  return {
    ...list(collection),
    ...associations(collection),
  };
};
