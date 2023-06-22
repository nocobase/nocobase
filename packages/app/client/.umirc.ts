import { getUmiConfig } from '@nocobase/devtools/umiConfig';
import { defineConfig } from 'umi';

const umiConfig = getUmiConfig();

process.env.MFSU_AD = 'none';
process.env.DID_YOU_KNOW = 'none';

export default defineConfig({
  title: 'Loading...',
  favicons: ['/favicon/favicon.ico'],
  metas: [
    { name: 'viewport', content: 'initial-scale=0.1' },
  ],
  links: [
    { rel: 'apple-touch-icon', size: '180x180', ref: '/favicon/apple-touch-icon.png' },
    { rel: 'icon', type: 'image/png', size: '32x32', ref: '/favicon/favicon-32x32.png' },
    { rel: 'icon', type: 'image/png', size: '16x16', ref: '/favicon/favicon-16x16.png' },
    { rel: 'manifest', href: '/favicon/site.webmanifest' },
    { rel: 'stylesheet', href: '/global.css' },
  ],
  headScripts: [
    '/browser-checker.js',
    '/set-router.js',
  ],
  hash: true,
  alias: {
    ...umiConfig.alias,
  },
  define: {
    ...umiConfig.define,
  },
  proxy: {
    ...umiConfig.proxy,
  },
  fastRefresh: false, // 热更新会导致 Context 丢失，不开启
  mfsu: false,
  esbuildMinifyIIFE: true,
  // srcTranspiler: 'esbuild', // 不行，各种报错
  // mfsu: {
  //   esbuild: true // 不行，各种报错
  // },
  // 浏览器兼容性，兼容到 2018 年的浏览器
  targets: {
    chrome: 69,
    edge: 79,
    safari: 12,
  },
  routes: [{ path: '/*', component: 'index' }],
});
