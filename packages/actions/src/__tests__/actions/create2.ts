import { ActionOptions } from '@nocobase/resourcer';
import { create } from '../../actions/common';

export default {
  ...create,
  fields: {
    only: ['title']
  }
} as unknown as ActionOptions;
