/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createRsbuild } from '@rsbuild/core';
import type { RsbuildConfig } from '@rsbuild/core';
import { pluginLess } from '@rsbuild/plugin-less';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginSvgr } from '@rsbuild/plugin-svgr';
import fg from 'fast-glob';
import fs from 'fs-extra';
import path from 'path';
import { build as tsupBuild } from 'tsup';

import { globExcludeFiles } from './constant';
import { PkgLog, UserConfig, getEnvDefine } from './utils';

export async function buildClient(cwd: string, userConfig: UserConfig, sourcemap: boolean = false, log: PkgLog) {
  log('build client');
  const cwdWin = cwd.replaceAll(/\\/g, '/');
  const cwdUnix = cwd.replaceAll(/\//g, '\\');
  const external = function (id: string) {
    if (!id || path.isAbsolute(id) || id.startsWith('.') || id.startsWith(cwdUnix) || id.startsWith(cwdWin)) {
      return false;
    }
    return true;
  };
  await buildClientEsm(cwd, userConfig, sourcemap, external, log);
  await buildClientLib(cwd, userConfig, sourcemap, external, log);
  await buildLocale(cwd, userConfig, log);
}

type External = (id: string) => boolean;
type ClientFormat = 'esm' | 'cjs';

async function buildClientEsm(cwd: string, userConfig: UserConfig, sourcemap: boolean, external: External, log: PkgLog) {
  log('build client esm');
  const entry = path.join(cwd, 'src/index.ts').replaceAll(/\\/g, '/');
  const outDir = path.resolve(cwd, 'es');
  await buildClientWithRsbuild(cwd, userConfig, sourcemap, external, entry, outDir, 'esm');
  await injectEntryStyleReference(path.join(outDir, 'index.mjs'), 'import "./index.css";');
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

  try {
    await buildClientWithRsbuild(cwd, userConfig, sourcemap, external, entry, outDir, 'cjs');
  } finally {
    fs.removeSync(entry);
  }

  await injectEntryStyleReference(path.join(outDir, 'index.js'), 'require("./index.css");');
}

async function buildClientWithRsbuild(
  cwd: string,
  userConfig: UserConfig,
  sourcemap: boolean,
  external: External,
  entry: string,
  outDir: string,
  format: ClientFormat,
) {
  const config = createClientRsbuildConfig(cwd, entry, outDir, sourcemap, external, format);
  const rsbuild = await createRsbuild({
    cwd,
    config: userConfig.modifyRsbuildConfig?.(config) ?? config,
  });

  const result = await rsbuild.build();
  await result.close();
}

function createClientRsbuildConfig(
  cwd: string,
  entry: string,
  outDir: string,
  sourcemap: boolean,
  external: External,
  format: ClientFormat,
): RsbuildConfig {
  return {
    plugins: [pluginReact(), pluginLess(), pluginSvgr()],
    source: {
      entry: {
        index: {
          import: entry,
          html: false,
        },
      },
      tsconfigPath: path.join(cwd, 'tsconfig.json'),
      define: getEnvDefine(),
      decorators: {
        version: 'legacy',
      },
    },
    output: {
      target: 'web',
      distPath: {
        root: outDir,
        js: '.',
        jsAsync: '.',
        css: '.',
        cssAsync: '.',
        svg: '.',
        font: '.',
        image: '.',
        media: '.',
        assets: '.',
      },
      filename: {
        js: format === 'esm' ? '[name].mjs' : '[name].js',
        css: '[name].css',
        svg: '[name][ext][query]',
        font: '[name][ext][query]',
        image: '[name][ext][query]',
        media: '[name][ext][query]',
        assets: '[name][ext][query]',
      },
      cleanDistPath: true,
      sourceMap: sourcemap,
      minify: process.env.NODE_ENV === 'production',
      emitCss: true,
      externals: [
        function ({ request }, callback) {
          if (request && external(request)) {
            return callback(null, true);
          }
          callback();
        },
      ],
    },
    performance: {
      chunkSplit: {
        strategy: 'all-in-one',
      },
    },
    tools: {
      rspack(config) {
        config.output = config.output || {};
        config.output.asyncChunks = false;

        if (format === 'esm') {
          config.output.library = { type: 'module' };
          config.output.module = true;
          config.output.chunkFormat = 'module';
          config.output.chunkLoading = 'import';
          config.output.workerChunkLoading = 'import';
          config.experiments = {
            ...config.experiments,
            outputModule: true,
          };
          config.externalsType = 'module-import';
        } else {
          config.output.library = { type: 'commonjs-static' };
        }

        config.performance = false;
        config.stats = 'errors-warnings';
      },
    },
  };
}

async function injectEntryStyleReference(entryFile: string, styleReference: string) {
  const cssFile = path.join(path.dirname(entryFile), 'index.css');
  if (!fs.existsSync(entryFile) || !fs.existsSync(cssFile)) {
    return;
  }

  const content = await fs.readFile(entryFile, 'utf8');
  if (content.startsWith(styleReference)) {
    return;
  }

  await fs.writeFile(entryFile, `${styleReference}\n${content}`);
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
      loader: { '.json': 'copy' },
    }),
  );
}
