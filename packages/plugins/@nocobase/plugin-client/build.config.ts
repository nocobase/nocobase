import fs from 'fs/promises';
import path from 'path';
import { defineConfig } from '@nocobase/build';

const existsSync = require('fs').existsSync;

const client = path.dirname(require.resolve('@nocobase/client/package.json'));
const antd = require.resolve('antd');

export default defineConfig({
  afterBuild: async (log) => {
    const localeDir = path.resolve(__dirname, './dist/locale');
    if (existsSync(localeDir)) {
      await fs.rm(localeDir, { recursive: true });
    }

    log('coping client locale');
    await fs.cp(path.resolve(client, 'lib', 'locale'), localeDir, {
      recursive: true,
      force: true,
    });

    log('coping antd locale');
    const files = await fs.readdir(path.resolve(path.dirname(antd), 'locale'));
    await fs.mkdir(path.resolve(localeDir, 'antd'), { recursive: true });
    for (const file of files) {
      if (path.extname(file) !== '.js') {
        continue;
      }
      const content = require(path.resolve(path.dirname(antd), 'locale', file)).default;
      try {
        await fs.writeFile(
          path.resolve(localeDir, 'antd', file),
          `module.exports = ${JSON.stringify(content)}`,
          'utf-8',
        );
      } catch (error) {
        log(`skip ${file}`);
      }
    }
  },
});
