import { defineConfig } from 'tsup';
import fg from 'fast-glob';
import path from 'path';
import { globExcludeFiles } from './src/constant';

const entry = fg.globSync(['src/**', ...globExcludeFiles], { cwd: __dirname, absolute: true });

export default defineConfig({
  entry,
  outDir: path.join(__dirname, 'lib'),
  splitting: false,
  silent: true,
  sourcemap: false,
  clean: true,
  bundle: false,
  loader: {
    '.d.ts': 'copy'
  },
  skipNodeModulesBundle: true,
});
