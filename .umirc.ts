import { defineConfig } from 'dumi';
import { getLocalStorageProxy } from '@nocobase/utils';

process.env.MFSU_AD = 'none';

const {
  API_ORIGIN = '',
  API_ORIGIN_DEV,
  API_BASE_PATH = '/api/'
} = process.env;

export default defineConfig({
  title: 'NocoBase',
  hash: true,
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
  resolve: {
    includes: ['docs', 'packages/client/src/schemas'],
  },
  styles: [
    `
    .__dumi-default-navbar-logo {
      height: 100%;
      width: 100px;
    }
    .__dumi-default-layout .__dumi-default-navbar {
      box-shadow: 0 0 3px rgb(60 72 88 / 15%);
    }
    .__dumi-default-layout[data-site-mode='true'] {
      padding-top: 150px !important;
    }
    @media only screen and (max-width: 767px) {
      .__dumi-default-layout[data-site-mode="true"] {
        padding-top: 128px !important;
      }
    }
    @media only screen and (min-width: 768px) {
      .__dumi-default-menu[data-mode='site'] {
        top: 100px !important;
      }
      .__dumi-default-layout[data-site-mode='true'] .__dumi-default-layout-toc {
        top: 150px !important;
      }
    }
    video {
      max-width: 800px;
      width: 100%;
      border-radius: 5px;
      box-shadow: 0 8px 24px -2px rgb(0 0 0 / 5%);
    }
    `,
  ],
  // mfsu: {},
  // ssr: {},
  // exportStatic: {},
  mode: 'site',
  logo: 'https://www.nocobase.com/images/logo.png',
  navs: {
    'en-US': [
      null,
      { title: 'GitHub', path: 'https://github.com/nocobase/nocobase' },
      // { title: 'Changelog', path: 'https://github.com/nocobase/nocobase/releases' },
    ],
    'zh-CN': [
      null,
      { title: 'GitHub', path: 'https://github.com/nocobase/nocobase' },
      // { title: '更新日志', path: 'https://github.com/nocobase/nocobase/releases' },
    ],
  },
  // more config: https://d.umijs.org/config
});
