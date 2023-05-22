import { getUmiConfig } from '@nocobase/devtools/umiConfig';
import { defineConfig } from 'umi';

const umiConfig = getUmiConfig();

process.env.MFSU_AD = 'none';

export default defineConfig({
  title: 'Loading...',
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
  srcTranspiler: 'esbuild',
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
