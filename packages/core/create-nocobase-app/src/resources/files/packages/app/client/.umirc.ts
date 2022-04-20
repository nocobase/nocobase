import { getUmiConfig } from '@nocobase/utils/umiConfig';
import dotenv from 'dotenv';
import { resolve } from 'path';
import { defineConfig } from 'umi';

dotenv.config({
  path: resolve(__dirname, '../../../.env'),
});

process.env.MFSU_AD = 'none';

const umiConfig = getUmiConfig();

export default defineConfig({
  hash: true,
  define: {
    'process.env.NOCOBASE_ENV': process.env.NOCOBASE_ENV,
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
    const clientSrc = resolve(__dirname, '../../../node_modules/@nocobase/client/src');
    config.module.rules.get('ts-in-node_modules').include.add(clientSrc);
    config.resolve.alias.set('@nocobase/client', clientSrc);
  },
});
