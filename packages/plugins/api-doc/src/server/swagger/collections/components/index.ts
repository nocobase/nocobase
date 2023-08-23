import { Collection } from '@nocobase/database';
import schemas from './schemas';
import parameters from './parameters';

export default (collection: Collection) => {
  return {
    ...schemas(collection),
    ...parameters(collection),
  };
};
