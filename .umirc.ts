import { defineConfig } from 'dumi';

const baseUrl = `http://localhost:${process.env.API_PORT || '13001'}/`;
console.log('baseUrl', baseUrl);

export default defineConfig({
  title: ' ',
  hash: true,
  define: {
    'process.env.API_URL': process.env.API_URL || `${baseUrl}api/`,
    'process.env.API_HOSTNAME': process.env.API_HOSTNAME,
  },
  proxy: {
    '/api/': {
      target: baseUrl,
      changeOrigin: true,
      pathRewrite: { '^/api/': '/api/' },
    },
  },
  resolve: {
    includes: ['docs'],
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
