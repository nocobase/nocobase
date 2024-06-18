import { defineConfig } from 'dumi';
import { getUmiConfig } from '@nocobase/devtools/umiConfig';
const umiConfig = getUmiConfig();

export default defineConfig({
  hash: true,
  fastRefresh: false,
  mfsu: false,
  cacheDirectoryPath: `node_modules/.docs-mobile-cache`,
  alias: {
    ...umiConfig.alias,
    "demos": require('path').resolve(__dirname, 'src/client/demoUtils'),
  },
  resolve: {
    atomDirs: [
      { type: 'component', dir: 'src/client' },
      { type: 'component', dir: 'src/server' },
    ],
  },
  metas: [
    {
      name: 'viewport',
      content:
        'width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover',
    },
  ],
});
