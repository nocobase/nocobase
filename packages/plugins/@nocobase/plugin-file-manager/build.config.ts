import { defineConfig } from '@nocobase/build';
import fs from 'fs/promises';
import path from 'path';

const pdfjsDist = path.dirname(require.resolve('pdfjs-dist/package.json'));

export default defineConfig({
  afterBuild: async (log) => {
    log('copying pdf.js preview resources');
    await fs.cp(path.resolve(pdfjsDist, 'cmaps'), path.resolve(__dirname, 'dist/client/pdfjs/cmaps'), {
      recursive: true,
      force: true,
    });
    await fs.cp(
      path.resolve(pdfjsDist, 'standard_fonts'),
      path.resolve(__dirname, 'dist/client/pdfjs/standard_fonts'),
      {
        recursive: true,
        force: true,
      },
    );
    await fs.copyFile(
      path.resolve(pdfjsDist, 'build/pdf.worker.min.mjs'),
      path.resolve(__dirname, 'dist/client/pdfjs/pdf.worker.min.mjs'),
    );
  },
});
