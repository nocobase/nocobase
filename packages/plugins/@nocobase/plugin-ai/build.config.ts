import { defineConfig } from '@nocobase/build';
import fg from 'fast-glob';
import fs from 'fs-extra';
import path from 'path';

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

    log('copying document loader dependencies');
    const documentLoaderDeps = [
      'mammoth',
      'officeparser',
      'pdf-parse',
      'word-extractor',
      // officeparser dependency
      'peek-readable',
      // pdf-parse dependency
      'node-ensure',
      // mammoth dependency
      'jszip',
      'setimmediate',
      '@xmldom/xmldom',
      'dingbat-to-unicode',
      'lop',
      'option',
      // word-extractor dependency
      'saxes',
      'xmlchars',
    ];
    for (const dep of documentLoaderDeps) {
      const depPath = path.resolve(process.cwd(), 'node_modules', dep);
      const distPath = path.resolve(__dirname, 'dist/node_modules', dep);
      log(`copying ${dep} from ${depPath} to ${distPath}`);
      await fs.promises.cp(depPath, distPath, {
        recursive: true,
        force: true,
      });
    }

    log('removing /**/*.d.ts');
    fg.sync(['./**/*.d.ts', './**/*.d.cts'], {
      cwd: path.resolve(__dirname, 'dist'),
      absolute: true,
      onlyFiles: true,
    }).forEach((file) => {
      fs.unlinkSync(file);
    });

    log('removing /**/*.md');
    fg.sync(['./**/*.md'], {
      cwd: path.resolve(__dirname, 'dist', 'node_modules'),
      absolute: true,
      onlyFiles: true,
    }).forEach((file) => {
      fs.unlinkSync(file);
    });

    log('removing /**/*.map');
    fg.sync(['./**/*.js.map', './**/*.cjs.map', './**/*.cts.map', './**/*.ts.map'], {
      cwd: path.resolve(__dirname, 'dist'),
      absolute: true,
      onlyFiles: true,
    }).forEach((file) => {
      fs.unlinkSync(file);
    });

    log('pdf-parse cleaning');
    fg.sync('pdf-parse/**/*', {
      cwd: path.resolve(__dirname, 'dist', 'node_modules'),
      absolute: false,
      onlyFiles: true,
    })
      .filter((file) => !(file.startsWith('pdf-parse/lib/pdf.js/v1.10.100/build') || file == 'pdf-parse/package.json'))
      .forEach((file) => fs.unlinkSync(path.resolve(__dirname, 'dist', 'node_modules', file)));

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
