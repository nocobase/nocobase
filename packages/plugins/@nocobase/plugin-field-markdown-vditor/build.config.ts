import { defineConfig } from '@nocobase/build';
import fs from 'fs/promises';
import path from 'path';

const vditor = path.dirname(require.resolve('vditor'));
const vditorTargets = ['dist/client/vditor/dist'];

export default defineConfig({
  afterBuild: async (log) => {
    log('copying vditor dist');
    await Promise.all(
      vditorTargets.map((target) =>
        fs.cp(vditor, path.resolve(__dirname, target), {
          recursive: true,
          force: true,
        }),
      ),
    );
  },
});
