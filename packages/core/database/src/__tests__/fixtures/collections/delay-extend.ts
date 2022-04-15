import { extend } from '../../../database';

export default extend({
  name: 'images',
  fields: [{ type: 'string', name: 'url' }],
});
