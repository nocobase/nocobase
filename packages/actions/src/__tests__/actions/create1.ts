import { ActionOptions } from '@nocobase/resourcer';
import { create } from '../../actions/common';

export default {
  values: {
    meta: {
      location: 'Kunming'
    }
  },

  fields: {
    except: ['sort', 'user.profile', 'comments.status']
  },

  handler: create
} as unknown as ActionOptions;
