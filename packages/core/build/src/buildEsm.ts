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
import { rspack } from '@rspack/core';

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

  return rspack({
    entry: {
      index: entry,
    },
    output: {
      path: outDir,
      library: {
        type: 'module',
      },
      clean: true,
    },
    target: ['node16'],
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    resolve: {
      tsConfig: path.join(process.cwd(), 'tsconfig.json'),
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json', '.less', '.css'],
    },
    module: {
      rules: [
        {
          test: /\.less$/,
          use: [
            { loader: 'style-loader' },
            { loader: 'css-loader' },
            { loader: require.resolve('less-loader') },
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  plugins: {
                    'postcss-preset-env': {
                      browsers: ['last 2 versions', '> 1%', 'cover 99.5%', 'not dead'],
                    },
                    autoprefixer: {},
                  },
                },
              },
            },
          ],
          type: 'javascript/auto',
        },
        {
          test: /\.css$/,
          use: [
            'style-loader',
            'css-loader',
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  plugins: {
                    'postcss-preset-env': {
                      browsers: ['last 2 versions', '> 1%', 'cover 99.5%', 'not dead'],
                    },
                    autoprefixer: {},
                  },
                },
              },
            },
          ],
          type: 'javascript/auto',
        },
        {
          test: /\.(png|jpe?g|gif)$/i,
          type: 'asset',
        },
        {
          test: /\.svg$/i,
          issuer: /\.[jt]sx?$/,
          use: ['@svgr/webpack'],
        },
        {
          test: /\.jsx$/,
          exclude: /[\\/]node_modules[\\/]/,
          loader: 'builtin:swc-loader',
          options: {
            sourceMap: true,
            jsc: {
              parser: {
                syntax: 'ecmascript',
                jsx: true,
              },
              target: 'es5',
            },
          },
        },
        {
          test: /\.tsx$/,
          exclude: /[\\/]node_modules[\\/]/,
          loader: 'builtin:swc-loader',
          options: {
            sourceMap: true,
            jsc: {
              parser: {
                syntax: 'typescript',
                tsx: true,
              },
              target: 'es5',
            },
          },
        },
        {
          test: /\.ts$/,
          exclude: /[\\/]node_modules[\\/]/,
          loader: 'builtin:swc-loader',
          options: {
            sourceMap: true,
            jsc: {
              parser: {
                syntax: 'typescript',
              },
              target: 'es5',
            },
          },
        },
      ],
    },
    externals: [
      function ({ request }, callback) {
        if (external(request)) {
          return callback(null, true);
        }
        callback();
      },
    ],
    plugins: [new rspack.DefinePlugin(getEnvDefine())],
    stats: 'errors-warnings',
  });

  // return viteBuild(
  //   userConfig.modifyViteConfig({
  //     mode: process.env.NODE_ENV || 'production',
  //     define: getEnvDefine(),
  //     build: {
  //       minify: false,
  //       outDir,
  //       cssCodeSplit: true,
  //       emptyOutDir: true,
  //       sourcemap,
  //       lib: {
  //         entry,
  //         formats: ['es'],
  //         fileName: 'index',
  //       },
  //       target: ['node16'],
  //       rollupOptions: {
  //         cache: true,
  //         treeshake: true,
  //         external,
  //       },
  //     },
  //   }),
  // );
}
