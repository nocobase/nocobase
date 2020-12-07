import { ActionOptions } from '@nocobase/resourcer';
import { create } from '../../actions/common';

export default {
  fields: {
    only: ['title']
  },

  handler: create
} as ActionOptions;
