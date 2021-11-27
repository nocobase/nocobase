import path from 'path';
import { URL } from 'url';
import { defineConfig } from 'umi';
import dotenv from 'dotenv';

dotenv.config({
  path: path.resolve(__dirname, '../../.env'),
});

const {
  API_PORT,
  API_BASE_PATH = '/api/',
  LOCAL_STORAGE_USE_STATIC_SERVER,
  LOCAL_STORAGE_BASE_URL
} = process.env;

const API_HOST = `http://localhost${API_PORT ? `:${API_PORT}` : ''}`;

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
      href: `${API_HOST}${baseUrl}`
    };
  }

  // if local storage url is some network address,
  // such as ip or domain name rather than 'localhost',
  // do not proxy.
  if (!url.href.startsWith(API_HOST)) {
    return {};
  }

  const config = {
    [baseUrl]: {
      target: API_HOST,
      changeOrigin: true,
    }
  }

  return config;
}

export default defineConfig({
  nodeModulesTransform: {
    type: 'none',
  },
  define: {
    'process.env.API_BASE_PATH': API_BASE_PATH,
    'process.env.API_PORT': API_PORT,
  },
  proxy: {
    [API_BASE_PATH]: {
      target: API_HOST,
      changeOrigin: true,
      pathRewrite: { [`^${API_BASE_PATH}`]: API_BASE_PATH },
    },
    // for local storage
    ...getLocalStorageProxy()
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
