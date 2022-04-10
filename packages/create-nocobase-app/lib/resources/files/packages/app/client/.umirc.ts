import dotenv from 'dotenv';
import { resolve } from 'path';
import { defineConfig } from 'umi';

dotenv.config({
  path: resolve(__dirname, '../../../.env'),
});

process.env.MFSU_AD = 'none';

export default defineConfig({
  hash: true,
  define: {
    'process.env.NOCOBASE_ENV': process.env.NOCOBASE_ENV,
  },
  // only proxy when using `umi dev`
  // if the assets are built, will not proxy
  proxy: {},
  nodeModulesTransform: {
    type: 'none',
  },
  routes: [{ path: '/', exact: false, component: '@/pages/index' }],
  // fastRefresh: {},
});
