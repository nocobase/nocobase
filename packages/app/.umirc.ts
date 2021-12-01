import path from 'path';
import { defineConfig } from 'umi';
import dotenv from 'dotenv';
import { getUmiConfig } from '@nocobase/utils';

dotenv.config({
  path: path.resolve(__dirname, '../../.env'),
});

process.env.MFSU_AD = 'none';

const umiConfig = getUmiConfig();

export default defineConfig({
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
  routes: [
    { path: '/', exact: false, component: '@/pages/index' },
  ],
  fastRefresh: {},
  locale: {
    default: 'zh-CN',
    // antd: false,
    // title: false,
    baseNavigator: false,
    baseSeparator: '-',
  },
});
