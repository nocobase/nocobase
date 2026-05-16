import { defineConfig } from '@nocobase/build';
import fs from 'fs/promises';
import path from 'path';

const vditor = path.dirname(require.resolve('vditor'));

export default defineConfig({
  afterBuild: async (log) => {
    log('coping vditor dist');
    await fs.cp(vditor, path.resolve(__dirname, 'dist/client/vditor/dist'), {
      recursive: true,
      force: true,
    });
  },
});
