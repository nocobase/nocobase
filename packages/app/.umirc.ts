import dotenv from 'dotenv';
import { resolve } from 'path';
import { defineConfig } from 'umi';
import { getUmiConfig } from '../utils/src/umiConfig';

dotenv.config({
  path: resolve(__dirname, '../../.env'),
});

process.env.MFSU_AD = 'none';

const umiConfig = getUmiConfig();

export default defineConfig({
  define: {
    ...umiConfig.define,
  },
  // only proxy when using `umi dev`
  // if the assets are built, will not proxy
  proxy: {
    ...umiConfig.proxy,
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
