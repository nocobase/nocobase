import { Collection } from '@nocobase/database';
import paths from './paths';
import components from './components';
import tags from './tags';

function collectionToSwaggerObject(collection: Collection) {
  return {
    paths: paths(collection),
    components: components(collection),
    tags: tags(collection),
  };
}

export default collectionToSwaggerObject;
