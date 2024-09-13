import { defineConfig } from 'dumi';
import { getUmiConfig } from '@nocobase/devtools/umiConfig';
const umiConfig = getUmiConfig();

export default defineConfig({
  hash: true,
  fastRefresh: false,
  mfsu: false,
  cacheDirectoryPath: `node_modules/.docs-mobile-cache`,
  alias: {
    ...umiConfig.alias
  },
  resolve: {
    atomDirs: [
      { type: 'component', dir: 'src/client' },
      { type: 'component', dir: 'src/server' },
    ],
  },
  styles: [`
    .dumi-mobile-demo-layout { padding: 0 !important; }
    .dumi-default-previewer-sources{ flex: 0 !important; margin-top: 50px; }
  `],
  metas: [
    {
      name: 'viewport',
      content:
        'width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover',
    },
  ],
});
