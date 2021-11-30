import { defineConfig } from 'umi';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({
  path: path.resolve(__dirname, './.env'),
});

process.env.MFSU_AD = 'none';

const {
  API_ORIGIN = '',
  API_ORIGIN_DEV,
  API_BASE_PATH = '/api/',
  LOCAL_STORAGE_USE_STATIC_SERVER,
  LOCAL_STORAGE_BASE_URL
} = process.env;

function getLocalStorageProxy() {
  if (!LOCAL_STORAGE_USE_STATIC_SERVER) {
    return {};
  }

  const baseUrl = LOCAL_STORAGE_BASE_URL || '/uploads';
  let url;
  try {
    url = new URL(baseUrl);
  } catch(e) {
    url = {
      href: `${API_ORIGIN_DEV}${baseUrl}`
    };
  }

  // if local storage url is some network address,
  // such as ip or domain name rather than API_ORIGIN,
  // do not proxy.
  if (!API_ORIGIN_DEV || !url.href.startsWith(API_ORIGIN_DEV)) {
    return {};
  }

  const config = {
    [baseUrl]: {
      target: API_ORIGIN_DEV,
      changeOrigin: true,
    }
  }

  return config;
}

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
