import { ResourceOptions } from '@nocobase/resourcer';

import create from '../actions/create';
import destroy from '../actions/destroy';

export default {
  name: 'attachments',
  actions: {
    create,
    destroy
  }
} as ResourceOptions;
