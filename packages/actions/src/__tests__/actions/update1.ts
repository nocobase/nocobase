import { ActionOptions } from '@nocobase/resourcer';
import { update } from '../../actions/common';

export default {
  ...update,
  values: {
    meta: {
      location: 'Kunming'
    }
  },

  fields: {
    except: ['title']
  }
} as unknown as ActionOptions;
