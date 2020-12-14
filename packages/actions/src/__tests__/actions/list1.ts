import { ActionOptions } from '@nocobase/resourcer';
import { list } from '../../actions/common';

const now = new Date();
const before7Days = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);

export default {
  filter: {
    status: 'published',
    published_at: {
      gte: before7Days.toISOString(),
      lt: now.toISOString()
    }
  },

  handler: list
} as ActionOptions;
