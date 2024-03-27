
import path from 'path';
import { PkgLog, UserConfig } from './utils';
import { build as viteBuild } from 'vite';
import fg from 'fast-glob';

export async function buildEsm(cwd: string, userConfig: UserConfig, sourcemap: boolean = false, log: PkgLog) {
  log('build esm');

  const indexEntry = path.join(cwd, 'src/index.ts').replaceAll(/\\/g, '/');
  const outDir = path.resolve(cwd, 'es');

  await build(cwd, indexEntry, outDir, userConfig, sourcemap, log);

  const clientEntry = fg.sync(['src/client/index.ts', 'src/client.ts'], { cwd, absolute: true, onlyFiles: true })?.[0]?.replaceAll(/\\/g, '/');
  const clientOutDir = path.resolve(cwd, 'es/client');
  if (clientEntry) {
    await build(cwd, clientEntry, clientOutDir, userConfig, sourcemap, log);
  }

  const pkg = require(path.join(cwd, 'package.json'));
  if (pkg.name === '@nocobase/test') {
    const e2eEntry = path.join(cwd, 'src/e2e/index.ts').replaceAll(/\\/g, '/');
    const e2eOutDir = path.resolve(cwd, 'es/e2e');
    await build(cwd, e2eEntry, e2eOutDir, userConfig, sourcemap, log);
  }
}

function build(cwd: string, entry: string, outDir: string, userConfig: UserConfig, sourcemap: boolean = false, log: PkgLog) {
  const cwdWin = cwd.replaceAll(/\\/g, '/');
  const cwdUnix = cwd.replaceAll(/\//g, '\\');
  const external = function (id: string) {
    if (id.startsWith('.') || id.startsWith(cwdUnix) || id.startsWith(cwdWin)) {
      return false;
    }
    return true;
  };
  return viteBuild(
    userConfig.modifyViteConfig({
      mode: process.env.NODE_ENV || 'production',
      define: {
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
        'process.env.__TEST__': false,
        'process.env.__E2E__': process.env.__E2E__ ? true : false,
      },
      build: {
        minify: false,
        outDir,
        cssCodeSplit: true,
        emptyOutDir: true,
        sourcemap,
        lib: {
          entry,
          formats: ['es'],
          fileName: 'index',
        },
        target: ['node16'],
        rollupOptions: {
          cache: true,
          treeshake: true,
          external,
        },
      },
    }),
  );
}
