import { defineConfig } from '@nocobase/build';

import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

export default defineConfig({
  afterBuild: async (log) => {
    const dir = path.resolve(__dirname, './dist/china-division');
    if (existsSync(dir)) {
      await fs.rm(dir, { recursive: true });
    }

    const keys = ['areas', 'cities', 'provinces'];
    for (const key of keys) {
      log(`coping ${key}.json`);
      await fs.cp(require.resolve(`china-division/dist/${key}.json`), path.resolve(dir, `${key}.json`), {
        recursive: true,
        force: true,
      });
    }
  },
});
