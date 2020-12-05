import { ActionOptions } from '@nocobase/resourcer';
import { update } from '../../actions/common';

export default {
  fields: {
    only: ['title']
  },

  handler: update
} as ActionOptions;
