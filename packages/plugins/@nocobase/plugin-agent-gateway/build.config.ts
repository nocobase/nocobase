import { defineConfig } from '@nocobase/build';
import { copyFile, mkdir } from 'fs/promises';
import path from 'path';

const BOOTSTRAP_ASSET_NAME = 'install-agent-gateway-daemon.sh';

export default defineConfig({
  afterBuild: async (log) => {
    const source = path.resolve(__dirname, 'src/server/assets', BOOTSTRAP_ASSET_NAME);
    const targetDirectory = path.resolve(__dirname, 'dist/server/assets');
    const target = path.resolve(targetDirectory, BOOTSTRAP_ASSET_NAME);

    log(`copying ${BOOTSTRAP_ASSET_NAME} to dist/server/assets`);
    await mkdir(targetDirectory, { recursive: true });
    await copyFile(source, target);
  },
});
