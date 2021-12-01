import { defineConfig } from 'umi';
import dotenv from 'dotenv';
import path from 'path';
import { getLocalStorageProxy } from '@nocobase/utils';

dotenv.config({
  path: path.resolve(__dirname, './.env'),
});

process.env.MFSU_AD = 'none';

const {
  API_ORIGIN = '',
  API_ORIGIN_DEV,
  API_BASE_PATH = '/api/'
} = process.env;

export default defineConfig({
  favicon: '/favicon.png',
  nodeModulesTransform: {
    type: 'none',
  },
  define: {
    'process.env.API_BASE_URL': `${API_ORIGIN}${API_BASE_PATH}`
  },
  // only proxy when using `umi dev`
  // if the assets are built, will not proxy
  proxy: !API_ORIGIN
    ? {
      [API_BASE_PATH]: {
        target: API_ORIGIN_DEV,
        changeOrigin: true,
        pathRewrite: { [`^${API_BASE_PATH}`]: API_BASE_PATH },
      },
      // for local storage
      ...getLocalStorageProxy()
    } : {},
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
