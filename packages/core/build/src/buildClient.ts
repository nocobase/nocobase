import path from 'path';
import fg from 'fast-glob';
import { build as viteBuild } from 'vite';
import { build as tsupBuild } from 'tsup';
import { libInjectCss } from 'vite-plugin-lib-inject-css';
import react from '@vitejs/plugin-react';
import { PkgLog } from './utils';
import { globExcludeFiles } from './constant';

export async function buildClient(cwd: string, sourcemap: boolean = false, log: PkgLog) {
  log('build client');

  await Promise.all([buildLib(cwd, sourcemap, 'cjs'), buildLib(cwd, sourcemap, 'es')]);
  await buildLocale(cwd);
}

export function buildLib(cwd: string, sourcemap: boolean, format: 'cjs' | 'es') {
  const outDir = path.resolve(cwd, format === 'cjs' ? 'lib' : 'es');
  const entry = path.join(cwd, 'src/index.ts').replaceAll(/\\/g, '/');
  const cwdWin = cwd.replaceAll(/\\/g, '/');
  const cwdUnix = cwd.replaceAll(/\//g, '\\');

  return viteBuild({
    mode: 'production',
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
    },
    build: {
      minify: false,
      outDir,
      cssCodeSplit: true,
      emptyOutDir: true,
      sourcemap,
      lib: {
        entry,
        formats: [format],
        fileName: 'index',
      },
      target: ['es2015', 'edge88', 'firefox78', 'chrome87', 'safari14'],
      rollupOptions: {
        cache: true,
        treeshake: true,
        external(id) {
          if (id.startsWith('.') || id.startsWith(cwdUnix) || id.startsWith(cwdWin)) {
            return false;
          }
          return true;
        },
      },
    },
    plugins: [react(), libInjectCss()],
  });
}

export function buildLocale(cwd: string) {
  const entry = fg.globSync(['src/locale/**', ...globExcludeFiles], { cwd, absolute: true });
  const outDir = path.resolve(cwd, 'lib', 'locale');
  return tsupBuild({
    entry,
    splitting: false,
    clean: false,
    bundle: false,
    silent: true,
    treeshake: false,
    target: 'node16',
    keepNames: true,
    outDir,
    format: 'cjs',
    skipNodeModulesBundle: true,
  });
}