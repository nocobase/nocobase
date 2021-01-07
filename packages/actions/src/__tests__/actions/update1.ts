import { ActionOptions } from '@nocobase/resourcer';
import { update } from '../../actions/common';

export default {
  values: {
    meta: {
      location: 'Kunming'
    }
  },

  fields: {
    except: ['title']
  },

  handler: update
} as ActionOptions;
