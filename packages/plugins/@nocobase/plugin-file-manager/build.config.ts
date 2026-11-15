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
      path.resolve(pdfjsDist, 'legacy/build/pdf.min.mjs'),
      path.resolve(__dirname, 'dist/client/pdfjs/pdf.min.mjs'),
    );
    await fs.copyFile(
      path.resolve(pdfjsDist, 'legacy/build/pdf.worker.min.mjs'),
      path.resolve(__dirname, 'dist/client/pdfjs/pdf.worker.min.mjs'),
    );
    // PDF.js loads the OpenJPEG JavaScript fallback from wasmUrl when useWasm is false.
    const wasmDest = path.resolve(__dirname, 'dist/client/pdfjs/wasm');
    await fs.mkdir(wasmDest, { recursive: true });
    for (const filename of ['openjpeg_nowasm_fallback.js', 'LICENSE_OPENJPEG', 'LICENSE_PDFJS_OPENJPEG']) {
      await fs.copyFile(path.resolve(pdfjsDist, 'wasm', filename), path.resolve(wasmDest, filename));
    }
  },
});
