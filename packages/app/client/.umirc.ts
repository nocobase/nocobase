import { getUmiConfig, resolveNocobasePackagesAlias } from '@nocobase/utils/umiConfig';
import { defineConfig } from 'umi';

const umiConfig = getUmiConfig();

process.env.MFSU_AD = 'none';

export default defineConfig({
  hash: true,
  define: {
    'process.env.NOCOBASE_ENV': process.env.NOCOBASE_ENV,
    ...umiConfig.define,
  },
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
