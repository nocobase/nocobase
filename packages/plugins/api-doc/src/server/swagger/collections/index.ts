import { Collection } from '@nocobase/database';
import paths from './paths';
import components from './components';
import tags from './tags';

function collectionToSwaggerObject(collection: Collection, options) {
  return {
    paths: paths(collection, options),
    components: components(collection, options),
    tags: tags(collection, options),
  };
}

export default collectionToSwaggerObject;
