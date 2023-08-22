import { Collection } from '@nocobase/database';
import paths from './paths';
import components from './components';

function collectionToSwaggerObject(collection: Collection) {
  return {
    paths: paths(collection),
    components: components(collection),
  };
}

export default collectionToSwaggerObject;
