import { defineConfig } from '@nocobase/build';
import fg from 'fast-glob';
import fs from 'fs-extra';
import path from 'path';

const DOCS_SOURCE_DIR = path.resolve(__dirname, '../../../../docs/docs/en');
const DOCS_DIST_DIR = path.resolve(__dirname, 'dist/ai/docs/nocobase');

export default defineConfig({
  beforeBuild: async () => {
    const distPath = path.resolve(__dirname, 'dist');
    await fs.remove(distPath);
  },

  afterBuild: async (log) => {
    log('copying markdown files from src/server to dist/server');
    await fs.copy(
      path.resolve(__dirname, 'src/server/ai-employees'),
      path.resolve(__dirname, 'dist/server/ai-employees'),
      {
        overwrite: true,
        filter: (src) => {
          // Keep directory structure and only copy .md files
          if (fs.lstatSync(src).isDirectory()) return true;
          return src.endsWith('.md');
        },
      },
    );

    if (await fs.pathExists(DOCS_SOURCE_DIR)) {
      log('copying NocoBase documentation files to dist/ai/docs/nocobase');
      await fs.copy(DOCS_SOURCE_DIR, DOCS_DIST_DIR, {
        overwrite: true,
        filter: (src) => {
          if (fs.lstatSync(src).isDirectory()) return true;
          return /\.(md|mdx)$/i.test(src);
        },
      });
    } else {
      log(`skipping NocoBase documentation copy, source directory not found: ${DOCS_SOURCE_DIR}`);
    }

    log('remove zod src dir');
    fg.sync('**/zod/src', {
      cwd: path.resolve(__dirname, 'dist', 'node_modules'),
      absolute: true,
      onlyDirectories: true,
    })
      .filter((dir) => dir.endsWith('/node_modules/zod/src'))
      .forEach((dir) => fs.rmSync(dir, { recursive: true, force: true }));
  },
});
