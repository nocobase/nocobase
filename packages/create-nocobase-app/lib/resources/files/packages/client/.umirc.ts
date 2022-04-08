import { resolve } from 'path';
import { defineConfig } from 'umi';


require('dotenv').config({
  path: resolve(__dirname, '../../.env'),
})

process.env.MFSU_AD = 'none';


export default defineConfig({
  hash: true,
  define: {
    'process.env.NOCOBASE_ENV': process.env.NOCOBASE_ENV,
  },

  nodeModulesTransform: {
    type: 'none',
  },
  routes: [{ path: '/', exact: false, component: '@/pages/index' }],
  // fastRefresh: {},
  chainWebpack(config) {
    config.module.rules
      .get('ts-in-node_modules')
      .include.add(resolve(__dirname, '../client/src'));
    config.resolve.alias.set(
      '@nocobase/client',
      resolve(__dirname, '../client/src'),
    );
  },
});
