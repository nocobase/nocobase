import { extend } from '../../../database';

export default extend({
  name: 'tags',
  fields: [{ type: 'string', name: 'color' }],
});
