import { resolve } from 'path';
import { defineConfig } from 'umi';

process.env.MFSU_AD = 'none';

export default defineConfig({
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
