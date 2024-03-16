import { getUmiConfig, IndexGenerator } from '@nocobase/devtools/umiConfig';
import path from 'path';
import { defineConfig } from 'umi';

const umiConfig = getUmiConfig();

process.env.MFSU_AD = 'none';
process.env.DID_YOU_KNOW = 'none';

const pluginPrefix = (process.env.PLUGIN_PACKAGE_PREFIX || '').split(',').filter((item) => !item.includes('preset')); // 因为现在 preset 是直接引入的，所以不能忽略，如果以后 preset 也是动态插件的形式引入，那么这里可以去掉

const pluginDirs = (process.env.PLUGIN_PATH || 'packages/plugins/,packages/samples/,packages/pro-plugins/')
  .split(',').map(item => path.join(process.cwd(), item));

const outputPluginPath = path.join(__dirname, 'src', '.plugins');
const indexGenerator = new IndexGenerator(outputPluginPath, pluginDirs);
indexGenerator.generate();

export default defineConfig({
  title: 'Loading...',
  devtool: process.env.NODE_ENV === 'development' ? 'source-map' : false,
  favicons: [`{{env.APP_PUBLIC_PATH}}favicon/favicon.ico`],
  metas: [{ name: 'viewport', content: 'initial-scale=0.1' }],
  links: [
    { rel: 'apple-touch-icon', size: '180x180', ref: `{{env.APP_PUBLIC_PATH}}favicon/apple-touch-icon.png` },
    { rel: 'icon', type: 'image/png', size: '32x32', ref: `{{env.APP_PUBLIC_PATH}}favicon/favicon-32x32.png` },
    { rel: 'icon', type: 'image/png', size: '16x16', ref: `{{env.APP_PUBLIC_PATH}}favicon/favicon-16x16.png` },
    { rel: 'manifest', href: `{{env.APP_PUBLIC_PATH}}favicon/site.webmanifest` },
    { rel: 'stylesheet', href: `{{env.APP_PUBLIC_PATH}}global.css` },
  ],
  headScripts: [
    {
      src: `{{env.APP_PUBLIC_PATH}}browser-checker.js`,
    },
    {
      content: `
        window['__webpack_public_path__'] = '{{env.APP_PUBLIC_PATH}}';
        window['__nocobase_api_base_url__'] = '{{env.API_BASE_URL}}';
        window['__nocobase_public_path__'] = '{{env.APP_PUBLIC_PATH}}';
        window['__nocobase_ws_url__'] = '{{env.WS_URL}}';
        window['__nocobase_ws_path__'] = '{{env.WS_PATH}}';
      `,
    },
  ],
  outputPath: path.resolve(__dirname, '../dist/client'),
  hash: true,
  alias: {
    ...umiConfig.alias,
  },
  define: {
    ...umiConfig.define,
    'process.env.USE_REMOTE_PLUGIN': process.env.USE_REMOTE_PLUGIN,
  },
  proxy: {
    ...umiConfig.proxy,
  },
  publicPath: 'auto',
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
  codeSplitting: {
    jsStrategy: 'depPerChunk'
  },
  chainWebpack(config, { env }) {
    if (env === 'production') {
      config.plugin('ignore nocobase plugins').use(require('webpack').IgnorePlugin, [
        {
          resourceRegExp: new RegExp(pluginPrefix.join('|')),
        },
      ]);
    }
    return config;
  },
  routes: [{ path: '/*', component: 'index' }],
});
