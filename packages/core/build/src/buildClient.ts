import react from '@vitejs/plugin-react';
import fg from 'fast-glob';
import fs from 'fs-extra';
import path from 'path';
import { build as tsupBuild } from 'tsup';
import { build as viteBuild } from 'vite';
import { libInjectCss } from 'vite-plugin-lib-inject-css';

import { globExcludeFiles } from './constant';
import { PkgLog, UserConfig } from './utils';

export async function buildClient(cwd: string, userConfig: UserConfig, sourcemap: boolean = false, log: PkgLog) {
  log('build client');
  const cwdWin = cwd.replaceAll(/\\/g, '/');
  const cwdUnix = cwd.replaceAll(/\//g, '\\');
  const external = function (id: string) {
    if (id.startsWith('.') || id.startsWith(cwdUnix) || id.startsWith(cwdWin)) {
      return false;
    }
    return true;
  };
  await buildClientEsm(cwd, userConfig, sourcemap, external, log);
  await buildClientLib(cwd, userConfig, sourcemap, external, log);
  await buildLocale(cwd, userConfig, log);
}

type External = (id: string) => boolean;

function buildClientEsm(cwd: string, userConfig: UserConfig, sourcemap: boolean, external: External, log: PkgLog) {
  log('build client esm');
  const entry = path.join(cwd, 'src/index.ts').replaceAll(/\\/g, '/');
  const outDir = path.resolve(cwd, 'es');
  return viteBuild(
    userConfig.modifyViteConfig({
      mode: process.env.NODE_ENV || 'production',
      define: {
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
        'process.env.__TEST__': false,
        'process.env.__E2E__': process.env.__E2E__ ? true : false,
      },
      build: {
        minify: process.env.NODE_ENV === 'production',
        outDir,
        cssCodeSplit: true,
        emptyOutDir: true,
        sourcemap,
        lib: {
          entry,
          formats: ['es'],
          fileName: 'index',
        },
        target: ['es2015', 'edge88', 'firefox78', 'chrome87', 'safari14'],
        rollupOptions: {
          cache: true,
          treeshake: true,
          external,
        },
      },
      plugins: [react(), libInjectCss()],
    }),
  );
}

async function buildClientLib(
  cwd: string,
  userConfig: UserConfig,
  sourcemap: boolean,
  external: External,
  log: PkgLog,
) {
  log('build client lib');
  const outDir = path.resolve(cwd, 'lib');
  const esDir = path.resolve(cwd, 'es');
  const entry = path.join(esDir, 'index.ts');

  fs.removeSync(entry);
  fs.linkSync(path.join(cwd, 'es/index.mjs'), entry);

  await viteBuild(
    userConfig.modifyViteConfig({
      mode: process.env.NODE_ENV || 'production',
      esbuild: {
        format: 'cjs',
      },
      build: {
        outDir,
        minify: process.env.NODE_ENV === 'production',
        sourcemap,
        lib: {
          entry: path.join(cwd, 'es/index.ts'),
          formats: ['cjs'],
          fileName: 'index',
        },
        rollupOptions: {
          external,
        },
      },
    }),
  );

  fs.removeSync(entry);

  const css = fg.sync('*.css', { cwd: esDir, absolute: true });
  css.forEach((file) => {
    fs.copySync(file, path.join(outDir, path.basename(file)));
  });
}

export function buildLocale(cwd: string, userConfig: UserConfig, log: PkgLog) {
  log('build client locale');

  const entry = fg.globSync(['src/locale/**', ...globExcludeFiles], { cwd, absolute: true });
  const outDir = path.resolve(cwd, 'lib', 'locale');
  return tsupBuild(
    userConfig.modifyTsupConfig({
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
    }),
  );
}
