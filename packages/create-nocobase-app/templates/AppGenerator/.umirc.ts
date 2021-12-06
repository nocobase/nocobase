import { defineConfig } from 'umi';
import dotenv from 'dotenv';
import path from 'path';
import { getUmiConfig } from '@nocobase/utils';

dotenv.config({
  path: path.resolve(__dirname, './.env'),
});

const umiConfig = getUmiConfig();

process.env.MFSU_AD = 'none';

export default defineConfig({
  favicon: '/favicon.png',
  nodeModulesTransform: {
    type: 'none',
  },
  define: {
    ...umiConfig.define,
  },
  // only proxy when using `umi dev`
  // if the assets are built, will not proxy
  proxy: {
    ...umiConfig.proxy,
  },
  routes: [{ path: '/', exact: false, component: '@/pages/index' }],
  fastRefresh: {},
  locale: {
    default: 'zh-CN',
    // antd: false,
    // title: false,
    baseNavigator: false,
    baseSeparator: '-',
  },
});
