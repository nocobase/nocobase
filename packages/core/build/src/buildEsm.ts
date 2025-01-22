/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import path from 'path';
import { PkgLog, UserConfig, getEnvDefine } from './utils';
import { build as viteBuild } from 'vite';
import fg from 'fast-glob';

const clientExt = '.{ts,tsx,js,jsx}';

function getSingleEntry(file: string, cwd: string) {
  return fg.sync([`${file}${clientExt}`], { cwd, absolute: true, onlyFiles: true })?.[0]?.replaceAll(/\\/g, '/');
}

export async function buildEsm(cwd: string, userConfig: UserConfig, sourcemap: boolean = false, log: PkgLog) {
  log('build esm');

  const indexEntry = getSingleEntry('src/index', cwd);
  const outDir = path.resolve(cwd, 'es');

  await build(cwd, indexEntry, outDir, userConfig, sourcemap, log);

  const clientEntry = getSingleEntry('src/client/index', cwd) || getSingleEntry('src/client', cwd);
  const clientOutDir = path.resolve(cwd, 'es/client');
  if (clientEntry) {
    await build(cwd, clientEntry, clientOutDir, userConfig, sourcemap, log);
  }

  const pkg = require(path.join(cwd, 'package.json'));
  if (pkg.name === '@nocobase/test') {
    const e2eEntry = getSingleEntry('src/e2e/index', cwd);
    const e2eOutDir = path.resolve(cwd, 'es/e2e');
    await build(cwd, e2eEntry, e2eOutDir, userConfig, sourcemap, log);

    const webEntry = getSingleEntry('src/web/index', cwd);
    const webOutDir = path.resolve(cwd, 'es/web');
    await build(cwd, webEntry, webOutDir, userConfig, sourcemap, log);
  }
}

function build(
  cwd: string,
  entry: string,
  outDir: string,
  userConfig: UserConfig,
  sourcemap: boolean = false,
  log: PkgLog,
) {
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
      define: getEnvDefine(),
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
