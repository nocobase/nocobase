import { ActionOptions } from '@nocobase/resourcer';
import { create } from '../../actions/common';

export default {
  defaultValues: {
    meta: {
      location: 'Kunming'
    }
  },

  fields: {
    except: ['sort']
  },

  handler: create
} as ActionOptions;
