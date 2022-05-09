import { getUmiConfig } from '@nocobase/utils/umiConfig';
import { resolve } from 'path';
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
    const clientSrc = resolve(__dirname, '../../core/client/src');
    const utilsSrc = resolve(__dirname, '../../core/utils/src');
    config.module.rules.get('ts-in-node_modules').include.add(clientSrc);
    config.resolve.alias.set('@nocobase/client', clientSrc);
    config.module.rules.get('ts-in-node_modules').include.add(utilsSrc);
    config.resolve.alias.set('@nocobase/utils', utilsSrc);
  },
});
