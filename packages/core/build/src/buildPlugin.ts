/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { rspack } from '@rspack/core';
import ncc from '@vercel/ncc';
import chalk from 'chalk';
import fg from 'fast-glob';
import fs from 'fs-extra';
import path from 'path';
import { build as tsupBuild } from 'tsup';
import * as bundleRequire from 'bundle-require';
import { EsbuildSupportExts, globExcludeFiles, PLUGIN_COMMERCIAL } from './constant';
import { PkgLog, UserConfig, getPackageJson } from './utils';
import {
  buildCheck,
  checkRequire,
  getExcludePackages,
  getIncludePackages,
  getPackagesFromFiles,
  getSourcePackages,
} from './utils/buildPluginUtils';
import { getDepPkgPath, getDepsConfig } from './utils/getDepsConfig';
import { RsdoctorRspackPlugin } from '@rsdoctor/rspack-plugin';
import { obfuscate } from './utils/obfuscationResult';
import pluginEsbuildCommercialInject from './plugins/pluginEsbuildCommercialInject';

const validExts = ['.ts', '.tsx', '.js', '.jsx', '.mjs'];
const serverGlobalFiles: string[] = ['src/**', '!src/client/**', ...globExcludeFiles];
const clientGlobalFiles: string[] = ['src/**', '!src/server/**', ...globExcludeFiles];
const sourceGlobalFiles: string[] = [
  'src/**/*.{ts,js,tsx,jsx,mjs}',
  '!src/**/__tests__',
  '!src/**/__benchmarks__',
];

const external = [
  // nocobase
  '@nocobase/acl',
  '@nocobase/actions',
  '@nocobase/auth',
  '@nocobase/cache',
  '@nocobase/client',
  '@nocobase/database',
  '@nocobase/data-source-manager',
  '@nocobase/evaluators',
  '@nocobase/lock-manager',
  '@nocobase/logger',
  '@nocobase/resourcer',
  '@nocobase/telemetry',
  '@nocobase/sdk',
  '@nocobase/server',
  '@nocobase/test',
  '@nocobase/utils',
  '@nocobase/license-kit',

  // @nocobase/auth
  'jsonwebtoken',

  // @nocobase/cache
  'cache-manager',

  // @nocobase/database
  'sequelize',
  'umzug',
  'async-mutex',

  // @nocobase/evaluators
  '@formulajs/formulajs',
  'mathjs',

  // @nocobase/logger
  'winston',
  'winston-daily-rotate-file',

  // koa
  'koa',
  '@koa/cors',
  '@koa/router',
  'multer',
  '@koa/multer',
  'koa-bodyparser',
  'koa-static',
  'koa-send',

  // react
  'react',
  'react-dom',
  'react/jsx-runtime',

  // react-router
  'react-router',
  'react-router-dom',

  // antd
  'antd',
  'antd-style',
  '@ant-design/icons',
  '@ant-design/cssinjs',

  // i18next
  'i18next',
  'react-i18next',

  // dnd-kit 相关
  '@dnd-kit/core',
  '@dnd-kit/sortable',

  // formily 相关
  '@formily/antd-v5',
  '@formily/core',
  '@formily/react',
  '@formily/json-schema',
  '@formily/path',
  '@formily/validator',
  '@formily/shared',
  '@formily/reactive',
  '@formily/reactive-react',

  // utils
  'dayjs',
  'mysql2',
  'pg',
  'pg-hstore',
  'sqlite3',
  'supertest',
  'axios',
  '@emotion/css',
  'ahooks',
  'lodash',
  'china-division',
  'file-saver',
];
const pluginPrefix = (
  process.env.PLUGIN_PACKAGE_PREFIX || '@nocobase/plugin-,@nocobase/preset-,@nocobase/plugin-pro-'
).split(',');

const target_dir = 'dist';

export function deleteServerFiles(cwd: string, log: PkgLog) {
  log('delete server files');
  const files = fg.globSync(['*'], {
    cwd: path.join(cwd, target_dir),
    absolute: true,
    deep: 1,
    onlyFiles: true,
  });
  const dirs = fg.globSync(['*', '!client', '!node_modules'], {
    cwd: path.join(cwd, target_dir),
    absolute: true,
    deep: 1,
    onlyDirectories: true,
  });
  [...files, ...dirs].forEach((item) => {
    fs.removeSync(item);
  });
}

export function writeExternalPackageVersion(cwd: string, log: PkgLog) {
  log('write external version');
  const sourceFiles = fg
    .globSync(sourceGlobalFiles, { cwd, absolute: true })
    .map((item) => fs.readFileSync(item, 'utf-8'));
  const sourcePackages = getSourcePackages(sourceFiles);
  const excludePackages = getExcludePackages(sourcePackages, external, pluginPrefix);
  const data = excludePackages.reduce<Record<string, string>>((prev, packageName) => {
    const depPkgPath = getDepPkgPath(packageName, cwd);
    const depPkg = require(depPkgPath);
    prev[packageName] = depPkg.version;
    return prev;
  }, {});
  const externalVersionPath = path.join(cwd, target_dir, 'externalVersion.js');
  fs.writeFileSync(externalVersionPath, `module.exports = ${JSON.stringify(data, null, 2)};`);
}

export async function buildServerDeps(cwd: string, serverFiles: string[], log: PkgLog) {
  log('build plugin server dependencies');
  const outDir = path.join(cwd, target_dir, 'node_modules');
  const serverFileSource = serverFiles
    .filter((item) => validExts.includes(path.extname(item)))
    .map((item) => fs.readFileSync(item, 'utf-8'));
  const sourcePackages = getSourcePackages(serverFileSource);
  const includePackages = getIncludePackages(sourcePackages, external, pluginPrefix);
  const excludePackages = getExcludePackages(sourcePackages, external, pluginPrefix);

  let tips = [];
  if (includePackages.length) {
    tips.push(
      `These packages ${chalk.yellow(includePackages.join(', '))} will be ${chalk.italic(
        'bundled',
      )} to dist/node_modules.`,
    );
  }
  if (excludePackages.length) {
    tips.push(`These packages ${chalk.yellow(excludePackages.join(', '))} will be ${chalk.italic('exclude')}.`);
  }
  tips.push(
    `For more information, please refer to: ${chalk.blue('https://docs.nocobase.com/development/others/deps')}.`,
  );
  log(tips.join(' '));

  if (!includePackages.length) return;

  const deps = getDepsConfig(cwd, outDir, includePackages, external);

  // bundle deps
  for (const dep of Object.keys(deps)) {
    const { outputDir, mainFile, pkg, nccConfig, depDir } = deps[dep];
    const outputPackageJson = path.join(outputDir, 'package.json');

    // cache check
    if (fs.existsSync(outputPackageJson)) {
      const outputPackage = require(outputPackageJson);
      if (outputPackage.version === pkg.version) {
        continue;
      }
    }

    // copy package
    await fs.copy(depDir, outputDir, { errorOnExist: false });

    // delete files
    const deleteFiles = fg.sync(
      [
        './**/*.map',
        './**/*.js.map',
        './**/*.md',
        './**/*.mjs',
        './**/*.png',
        './**/*.jpg',
        './**/*.jpeg',
        './**/*.gif',
        './**/*/.bin',
        './**/*/bin',
        './**/*/LICENSE',
        './**/*/tsconfig.json',
      ],
      { cwd: outputDir, absolute: true },
    );

    deleteFiles.forEach((file) => {
      fs.unlinkSync(file);
    });

    await ncc(dep, nccConfig).then(
      ({ code, assets }: { code: string; assets: Record<string, { source: string; permissions: number }> }) => {
        // emit dist file
        fs.writeFileSync(mainFile, code, 'utf-8');

        // emit assets
        Object.entries(assets).forEach(([name, item]) => {
          fs.writeFileSync(path.join(outputDir, name), item.source, {
            encoding: 'utf-8',
            mode: item.permissions,
          });
        });

        // emit package.json
        fs.writeFileSync(
          outputPackageJson,
          JSON.stringify({
            ...pkg,
            _lastModified: new Date().toISOString(),
          }),
          'utf-8',
        );
      },
    );
  }
}

export async function buildPluginServer(cwd: string, userConfig: UserConfig, sourcemap: boolean, log: PkgLog) {
  log('build plugin server source');
  const packageJson = getPackageJson(cwd);
  const serverFiles = fg.globSync(serverGlobalFiles, { cwd, absolute: true });
  buildCheck({ cwd, packageJson, entry: 'server', files: serverFiles, log });
  const otherExts = Array.from(
    new Set(serverFiles.map((item) => path.extname(item)).filter((item) => !EsbuildSupportExts.includes(item))),
  );
  if (otherExts.length) {
    log('%s will not be processed, only be copied to the dist directory.', chalk.yellow(otherExts.join(',')));
  }

  deleteServerFiles(cwd, log);

  await tsupBuild(
    userConfig.modifyTsupConfig({
      entry: serverFiles,
      splitting: false,
      clean: false,
      bundle: false,
      silent: true,
      treeshake: false,
      target: 'node16',
      sourcemap,
      outDir: path.join(cwd, target_dir),
      format: 'cjs',
      skipNodeModulesBundle: true,
      loader: {
        ...otherExts.reduce((prev, cur) => ({ ...prev, [cur]: 'copy' }), {}),
        '.json': 'copy',
      },
    }),
  );

  await buildServerDeps(cwd, serverFiles, log);
}

export async function buildProPluginServer(cwd: string, userConfig: UserConfig, sourcemap: boolean, log: PkgLog) {
  log('build pro plugin server source');
  const packageJson = getPackageJson(cwd);
  const serverFiles = fg.globSync(serverGlobalFiles, { cwd, absolute: true });
  buildCheck({ cwd, packageJson, entry: 'server', files: serverFiles, log });
  const otherExts = Array.from(
    new Set(serverFiles.map((item) => path.extname(item)).filter((item) => !EsbuildSupportExts.includes(item))),
  );
  if (otherExts.length) {
    log('%s will not be processed, only be copied to the dist directory.', chalk.yellow(otherExts.join(',')));
  }

  deleteServerFiles(cwd, log);

  // remove compilerOptions.paths in tsconfig.json
  let tsconfig = bundleRequire.loadTsConfig(path.join(cwd, 'tsconfig.json'));
  fs.writeFileSync(path.join(cwd, 'tsconfig.json'), JSON.stringify({
    ...tsconfig.data,
    compilerOptions: { ...tsconfig.data.compilerOptions, paths: [] }
  }, null, 2));
  tsconfig = bundleRequire.loadTsConfig(path.join(cwd, 'tsconfig.json'));

  // convert all ts to js, some files may not be referenced by the entry file
  await tsupBuild(
    userConfig.modifyTsupConfig({
      entry: serverFiles,
      splitting: false,
      clean: false,
      bundle: false,
      silent: true,
      treeshake: false,
      target: 'node16',
      sourcemap,
      outDir: path.join(cwd, target_dir),
      format: 'cjs',
      skipNodeModulesBundle: true,
      loader: {
        ...otherExts.reduce((prev, cur) => ({ ...prev, [cur]: 'copy' }), {}),
        '.json': 'copy',
      },
    }),
  );

  const entryFile = path.join(cwd, 'src/server/index.ts');
  if (!fs.existsSync(entryFile)) {
    log('server entry file not found', entryFile);
    return;
  }

  // plugin-commercial build to a bundle
  const externalOptions = {
    external: [],
    noExternal: [],
    onSuccess: async () => {},
    esbuildPlugins: [],
  };
  // other plugins build to a bundle just include plugin-commercial
  if (!cwd.includes(PLUGIN_COMMERCIAL)) {
    externalOptions.external = [/^[./]/];
    externalOptions.noExternal = [entryFile, /@nocobase\/plugin-commercial\/server/, /dist\/server\/index\.js/];
    externalOptions.onSuccess = async () => {
      const serverFiles = [path.join(cwd, target_dir, 'server', 'index.js')];
      serverFiles.forEach((file) => {
        obfuscate(file);
      });
    };
    externalOptions.esbuildPlugins = [pluginEsbuildCommercialInject];
  }

  // bundle all files、inject commercial code and obfuscate
  await tsupBuild(
    userConfig.modifyTsupConfig({
      entry: [entryFile],
      // minify: true,
      splitting: false,
      clean: false,
      bundle: true,
      silent: true,
      treeshake: false,
      target: 'node16',
      sourcemap,
      outDir: path.join(cwd, target_dir, 'server'),
      format: 'cjs',
      skipNodeModulesBundle: true,
      tsconfig: tsconfig.path,
      loader: {
        ...otherExts.reduce((prev, cur) => ({ ...prev, [cur]: 'copy' }), {}),
        '.json': 'copy',
      },

      ...externalOptions,
    }),
  );
  fs.removeSync(tsconfig.path);

  await buildServerDeps(cwd, serverFiles, log);
}

export async function buildPluginClient(cwd: string, userConfig: any, sourcemap: boolean, log: PkgLog, isCommercial = false) {
  log('build plugin client');
  const packageJson = getPackageJson(cwd);
  const clientFiles = fg.globSync(clientGlobalFiles, { cwd, absolute: true });
  if (isCommercial) {
    const commercialFiles = fg.globSync(clientGlobalFiles, { cwd: path.join(process.cwd(), 'packages/pro-plugins', PLUGIN_COMMERCIAL), absolute: true });
    clientFiles.push(...commercialFiles);
  }
  const clientFileSource = clientFiles.map((item) => fs.readFileSync(item, 'utf-8'));
  const sourcePackages = getPackagesFromFiles(clientFileSource);
  const excludePackages = getExcludePackages(sourcePackages, external, pluginPrefix);

  checkRequire(clientFiles, log);
  buildCheck({ cwd, packageJson, entry: 'client', files: clientFiles, log });
  const outDir = path.join(cwd, target_dir, 'client');

  const globals = excludePackages.reduce<Record<string, string>>((prev, curr) => {
    if (curr.startsWith('@nocobase')) {
      prev[`${curr}/client`] = `${curr}/client`;
    }
    prev[curr] = curr;
    return prev;
  }, {});

  const entry = fg.globSync('index.{ts,tsx,js,jsx}', { absolute: false, cwd: path.join(cwd, 'src/client') });
  const outputFileName = 'index.js';
  const compiler = rspack({
    mode: 'production',
    // mode: "development",
    context: cwd,
    entry: './src/client/' + entry[0],
    target: ['web', 'es5'],
    output: {
      path: outDir,
      filename: outputFileName,
      chunkFilename: '[chunkhash].js',
      publicPath: `auto`, // will be generated by the custom plugin
      clean: true,
      library: {
        name: packageJson.name,
        type: 'umd',
        umdNamedDefine: true,
      },
    },
    amd: {},
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
          type: 'asset',
          resourceQuery: { not: [/react/] }, // exclude react component if *.svg?react
        },
        {
          test: /\.svg$/i,
          issuer: /\.[jt]sx?$/,
          resourceQuery: /react/, // *.svg?react
          use: ['@svgr/webpack'],
        },
        {
          test: /\.(?:js|mjs|cjs|ts|tsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              targets: 'defaults',
              // presets: [['@babel/preset-env']],
              plugins: ['react-imported-component/babel'],
            },
          },
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
          use: [
            {
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
              loader: require.resolve('./plugins/pluginRspackCommercialLoader'),
              options: {
                isCommercial
              }
            }
          ]
        },
        {
          test: /\.ts$/,
          exclude: /[\\/]node_modules[\\/]/,
          use: [
            {
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
            {
              loader: require.resolve('./plugins/pluginRspackCommercialLoader'),
              options: {
                isCommercial
              }
            }
          ]
        },
      ],
    },
    plugins: [
      new rspack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify('production'),
        'process.env.NODE_DEBUG': false,
      }),
      {
        apply(compiler) {
          compiler.hooks.compilation.tap('CustomPublicPathPlugin', (compilation) => {
            compilation.hooks.runtimeModule.tap('CustomPublicPathPlugin', (module) => {
              if (module.name === 'auto_public_path') {
                // 处理所有可能的情况
                module.source = {
                  source: `
__webpack_require__.p = (function() {
  var publicPath = window['__nocobase_public_path__'] || '/';
  // 确保路径以 / 结尾
  if (!publicPath.endsWith('/')) {
    publicPath += '/';
  }
  return publicPath + 'static/plugins/${packageJson.name}/dist/client/';
})();`,
                };
              }
            });
          });
        },
      },
      process.env.BUILD_ANALYZE === 'true' &&
      new RsdoctorRspackPlugin({
        // plugin options
        // supports: {
        //   generateTileGraph: true,
        // },
        mode: 'brief',
      }),
    ].filter(Boolean),
    node: {
      global: true,
    },
    externals: {
      react: 'React',
      lodash: 'lodash',
      // 'react/jsx-runtime': 'jsxRuntime',
      ...globals,
    },
    stats: 'errors-warnings',
  });

  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      const compilationErrors = stats?.compilation.errors;
      const infos = stats.toString({
        colors: true,
      });
      if (err || compilationErrors?.length) {
        reject(err || infos);
        return;
      }
      console.log(infos);
      resolve(null);
    });
  });
  // await viteBuild(userConfig.modifyViteConfig({
  //   mode: 'production',
  //   define: {
  //     'process.env.NODE_ENV': JSON.stringify('production'),
  //   },
  //   logLevel: 'warn',
  //   build: {
  //     minify: true,
  //     outDir,
  //     cssCodeSplit: false,
  //     emptyOutDir: true,
  //     sourcemap,
  //     lib: {
  //       entry,
  //       formats: ['umd'],
  //       name: packageJson.name,
  //       fileName: () => outputFileName,
  //     },
  //     target: ['es2015', 'edge88', 'firefox78', 'chrome87', 'safari14'],
  //     rollupOptions: {
  //       cache: true,
  //       external: [...Object.keys(globals), 'react', 'react/jsx-runtime'],
  //       output: {
  //         exports: 'named',
  //         globals: {
  //           react: 'React',
  //           'react/jsx-runtime': 'jsxRuntime',
  //           ...globals,
  //         },
  //       },
  //     },
  //   },
  //   plugins: [
  //     react(),
  //     cssInjectedByJsPlugin({ styleId: packageJson.name }),
  //   ],
  // }));

  // checkFileSize(outDir, log);
}

export async function buildPlugin(cwd: string, userConfig: UserConfig, sourcemap: boolean, log: PkgLog) {
  if (cwd.includes('/pro-plugins/') && fs.existsSync(path.join(process.cwd(), 'packages/pro-plugins/', PLUGIN_COMMERCIAL))) {
    await buildPluginClient(cwd, userConfig, sourcemap, log, true);
    await buildProPluginServer(cwd, userConfig, sourcemap, log);
  } else {
    await buildPluginClient(cwd, userConfig, sourcemap, log);
    await buildPluginServer(cwd, userConfig, sourcemap, log);
  }
  writeExternalPackageVersion(cwd, log);
}
