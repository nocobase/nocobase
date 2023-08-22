import { Collection } from '@nocobase/database';
import list from './list';
import create from './create';
import update from './update';

export default (collection: Collection) => {
  return {
    ...list(collection),
    ...create(collection),
    ...update(collection),
  };
};
