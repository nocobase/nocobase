import { ActionOptions } from '@nocobase/resourcer';
import { create } from '../../actions/common';

export default {
  ...create,
  values: {
    meta: {
      location: 'Kunming'
    }
  },

  fields: {
    except: ['sort', 'user.profile', 'comments.status']
  }
} as unknown as ActionOptions;
