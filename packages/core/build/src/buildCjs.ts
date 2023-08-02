import { build } from 'tsup';
import fg from 'fast-glob';
import path from 'path';
import { globExcludeFiles } from './constant';
import { PkgLog } from './utils';

export function buildCjs(cwd: string, sourcemap: boolean = false, log?: PkgLog) {
  log('build cjs');

  const entry = fg.globSync(['src/**', ...globExcludeFiles], { cwd, absolute: true });
  const outDir = path.join(cwd, 'lib');

  return build({
    entry,
    splitting: false,
    clean: true,
    bundle: false,
    silent: true,
    sourcemap,
    treeshake: true,
    target: 'node16',
    keepNames: true,
    outDir,
    loader: {
      '.pegjs': 'file',
    },
    format: 'cjs',
    skipNodeModulesBundle: true,
  });
}
