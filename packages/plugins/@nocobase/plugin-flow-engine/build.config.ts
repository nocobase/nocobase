import { defineConfig } from '@nocobase/build';
import fs from 'fs/promises';
import path from 'path';

const existsSync = require('fs').existsSync;

const client = path.dirname(require.resolve('@nocobase/flow-engine/package.json'));

export default defineConfig({
  afterBuild: async (log) => {
    const localeDir = path.resolve(__dirname, './dist/locale');
    if (existsSync(localeDir)) {
      await fs.rm(localeDir, { recursive: true });
    }

    log('coping flow-engine locale');
    await fs.cp(path.resolve(client, 'lib', 'locale'), localeDir, {
      recursive: true,
      force: true,
    });
  },
});
