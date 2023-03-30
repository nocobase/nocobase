import { getUmiConfig } from '@nocobase/devtools/umiConfig';
import { defineConfig } from 'umi';

const umiConfig = getUmiConfig();

process.env.MFSU_AD = 'none';

export default defineConfig({
  hash: true,
  alias: {
    ...umiConfig.alias,
  },
  define: {
    ...umiConfig.define,
  },
  // only proxy when using `umi dev`
  // if the assets are built, will not proxy
  proxy: {
    ...umiConfig.proxy,
  },
  routes: [{ path: '/*', component: '@/pages/index' }],
  fastRefresh: true,
  mfsu: false,
  chainWebpack(memo) {
    // resolveNocobasePackagesAlias(memo);

    // 在引入 mermaid 之后，运行 yarn dev 的时候会报错，添加下面的代码可以解决。
    memo.module
      .rule('js-in-node_modules')
      .test(/.*mermaid.*\.js$/)
      .include.clear();
    return memo;
  },
});
