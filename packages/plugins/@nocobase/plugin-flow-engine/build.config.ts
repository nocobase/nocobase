import { defineConfig } from '@nocobase/build';
import fs from 'fs/promises';
import path from 'path';

const existsSync = require('fs').existsSync;

const client = path.dirname(require.resolve('@nocobase/flow-engine/package.json'));

export default defineConfig({
  afterBuild: async (log) => {
    const localeDir = path.resolve(__dirname, './dist/locale');
    const builtFlowEngineLocaleDir = path.resolve(client, 'lib', 'locale');
    const sourceFlowEngineLocaleDir = path.resolve(client, 'src', 'locale');
    const flowEngineLocaleDir = existsSync(builtFlowEngineLocaleDir)
      ? builtFlowEngineLocaleDir
      : sourceFlowEngineLocaleDir;
    if (existsSync(localeDir)) {
      await fs.rm(localeDir, { recursive: true });
    }

    log('coping flow-engine locale');
    await fs.cp(flowEngineLocaleDir, localeDir, {
      recursive: true,
      force: true,
    });
  },
});
