import { defineConfig } from 'umi';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({
  path: path.resolve(__dirname, '../../.env'),
});

export default defineConfig({
  nodeModulesTransform: {
    type: 'none',
  },
  define: {
    'process.env.API_URL': process.env.API_URL,
  },
  routes: [
    { path: '/', exact: false, component: '@/pages/index' },
  ],
  fastRefresh: {},
});
