import { getUmiConfig } from '@nocobase/devtools/umiConfig';
import { defineConfig } from 'umi';

const umiConfig = getUmiConfig();

process.env.MFSU_AD = 'none';

export default defineConfig({
  title: 'Loading...',
  favicons: ['/favicon/favicon.ico'],
  metas: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
  ],
  links: [
    { rel: 'apple-touch-icon', size: '180x180', ref: '/favicon/apple-touch-icon.png' },
    { rel: 'icon', type: 'image/png', size: '32x32', ref: '/favicon/favicon-32x32.png' },
    { rel: 'icon', type: 'image/png', size: '16x16', ref: '/favicon/favicon-16x16.png' },
    { rel: 'manifest', href: '/favicon/site.webmanifest' },
    { rel: 'stylesheet', href: '/global.css' },
  ],
  headScripts: [
    '/browser-checker.js'
  ],
  scripts: [
    '/set-router.js'
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
  fastRefresh: true,
  mfsu: false,
  routes: [{ path: '/*', component: 'index' }],
  chainWebpack(memo) {
    // umi4 可能不需要这个配置，通过 debugger 没看到 mermaid，甚至没有 js-in-node_modules
    memo.module
      .rule('js-in-node_modules')
      .test(/.*mermaid.*\.js$/)
      .include.clear();
    return memo;
  },
});
