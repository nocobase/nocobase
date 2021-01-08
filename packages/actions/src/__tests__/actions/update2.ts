import { ActionOptions } from '@nocobase/resourcer';
import { update } from '../../actions/common';

export default {
  ...update,
  fields: {
    only: ['title']
  }
} as unknown as ActionOptions;
