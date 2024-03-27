
import { build } from 'tsup';
import path from 'path';
import { PkgLog, UserConfig } from './utils';
import { build as viteBuild } from 'vite';

export function buildEsm(cwd: string, userConfig: UserConfig, sourcemap: boolean = false, log: PkgLog) {
  log('build esm');
  const cwdWin = cwd.replaceAll(/\\/g, '/');
  const cwdUnix = cwd.replaceAll(/\//g, '\\');
  const external = function (id: string) {
    if (id.startsWith('.') || id.startsWith(cwdUnix) || id.startsWith(cwdWin)) {
      return false;
    }
    return true;
  };
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
