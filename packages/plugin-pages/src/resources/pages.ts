import { ResourceOptions } from '@nocobase/resourcer';
import getRoutes from '../actions/getRoutes';

export default {
  name: 'pages',
  actions: {
    getRoutes,
  },
} as ResourceOptions;
