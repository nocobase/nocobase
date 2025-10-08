import { defineConfig } from 'dumi';
import { getUmiConfig } from '@nocobase/devtools/umiConfig';

const umiConfig = getUmiConfig();


export default defineConfig({
  hash: true,
  mfsu: false,
  alias: {
    ...umiConfig.alias,
  },
  fastRefresh: false, // 热更新会导致 Context 丢失，不开启
  // ssr: {},
  // exportStatic: {
  //   ignorePreRenderError: true
  // },
  cacheDirectoryPath: `node_modules/.docs-flow-engine-cache`,
  themeConfig: {}
});
