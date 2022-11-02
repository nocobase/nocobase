import { umiConfig as UmiConfig } from '@nocobase/devtools';

const { getUmiConfig, resolveNocobasePackagesAlias } = UmiConfig;

import { defineConfig } from 'umi';

const umiConfig = getUmiConfig();

process.env.MFSU_AD = 'none';

export default defineConfig({
  hash: true,
  define: {
    ...umiConfig.define,
  },
  dynamicImportSyntax: {},
  // only proxy when using `umi dev`
  // if the assets are built, will not proxy
  proxy: {
    ...umiConfig.proxy,
  },
  nodeModulesTransform: {
    type: 'none',
  },
  routes: [{ path: '/', exact: false, component: '@/pages/index' }],
  // fastRefresh: {},
  chainWebpack(config) {
    resolveNocobasePackagesAlias(config);
  },
});
