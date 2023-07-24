import fs from 'fs';
import chalk from 'chalk';
import ncc from '@vercel/ncc';
import path from 'path';
import react from '@vitejs/plugin-react'
import { build as tsupBuild } from 'tsup'
import { build as viteBuild } from 'vite'
import fg from 'fast-glob'
import { buildCheck, formatFileSize, getExcludePackages, getFileSize, getIncludePackages, getPackageJson, getSourcePackages } from './utils/buildPluginUtils';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'
import { getDepsConfig } from './utils/getDepsConfig';

const serverGlobalFiles: string[] = [
  'src/**',
  '!src/**/__tests__',
  '!src/client/**'
]

const clientGlobalFiles: string[] = [
  'src/client/**',
  '!src/**/__tests__',
]

const external = [
  // nocobase
  '@nocobase/acl',
  '@nocobase/actions',
  '@nocobase/auth',
  '@nocobase/cache',
  '@nocobase/client',
  '@nocobase/database',
  '@nocobase/evaluators',
  '@nocobase/logger',
  '@nocobase/resourcer',
  '@nocobase/sdk',
  '@nocobase/server',
  '@nocobase/test',
  '@nocobase/utils',

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
  '@dnd-kit/accessibility',
  '@dnd-kit/core',
  '@dnd-kit/modifiers',
  '@dnd-kit/sortable',
  '@dnd-kit/utilities',

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
  'lodash'
]
const pluginPrefix = (process.env.PLUGIN_PACKAGE_PREFIX || '@nocobase/plugin-,@nocobase/preset-,@nocobase/plugin-pro-').split(
  ',');

type Log = (msg: string, ...args: any) => void;


const target_dir = 'dist'

export function deleteJsFiles(cwd: string, log: Log) {
  log('delete babel js files')
  const jsFiles = fg.globSync(['**/*', '!**/*.d.ts', '!node_modules'], { cwd: path.join(cwd, target_dir), absolute: true })
  jsFiles.forEach(item => {
    fs.unlinkSync(item);
  })
}

export async function buildServerDeps(cwd: string, serverFiles: string[], log: Log) {
  log('build server dependencies')
  const outDir = path.join(cwd, target_dir, 'node_modules');
  const sourcePackages = getSourcePackages(serverFiles)
  const includePackages = getIncludePackages(sourcePackages, external, pluginPrefix);
  const excludePackages = getExcludePackages(sourcePackages, external, pluginPrefix)

  let tips = [];
  if (includePackages.length) {
    tips.push(`These packages ${chalk.yellow(includePackages.join(', '))} will be ${chalk.bold('bundled')} to dist/node_modules.`)
  }
  if (excludePackages.length) {
    tips.push(`These packages ${chalk.yellow(excludePackages.join(', '))} will be ${chalk.bold('exclude')}.`)
  }
  tips.push(`For more information, please refer to: ${chalk.blue('https://docs.nocobase.com/development/deps')}.`)
  log(tips.join(' '))

  if (!includePackages.length) return;

  const deps = getDepsConfig(cwd, outDir, includePackages, external);

  // bundle deps
  for (const dep of Object.keys(deps)) {
    const { output, pkg, nccConfig } = deps[dep];
    const outputDir = path.dirname(output);
    const outputPackageJson = path.join(outputDir, 'package.json');

    // cache check
    if (fs.existsSync(outputPackageJson)) {
      const outputPackage = require(outputPackageJson);
      if (outputPackage.version === pkg.version) {
        continue;
      }
    }

    await ncc(dep, nccConfig).then(
      ({
        code,
        assets,
      }: {
        code: string;
        assets: Record<string, { source: string; permissions: number }>;
      }) => {
        // create dist path
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
        // emit dist file
        fs.writeFileSync(output, code, 'utf-8');

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
            name: pkg.name,
            version: pkg.version,
            author: pkg.author,
            authors: pkg.authors,
            contributors: pkg.contributors,
            license: pkg.license,
            _lastModified: new Date().toISOString(),
          }),
          'utf-8',
        );
      },
    );
  }
}

export async function buildPluginServer(cwd: string, log: Log) {
  log('build server source')
  const packageJson = getPackageJson(cwd);
  const serverFiles = fg.globSync(serverGlobalFiles, { cwd, absolute: true })
  buildCheck({ cwd, packageJson, entry: 'server', files: serverFiles, log })

  await tsupBuild({
    entry: serverFiles,
    splitting: false,
    clean: false,
    bundle: false,
    silent: true,
    treeshake: true,
    target: 'node16',
    outDir: path.join(cwd, target_dir),
    format: 'cjs',
    skipNodeModulesBundle: true
  })

  await buildServerDeps(cwd, serverFiles, log)
}

export function buildPluginClient(cwd: string, log: Log) {
  log('build client')

  const packageJson = getPackageJson(cwd);
  const clientFiles = fg.globSync(clientGlobalFiles, { cwd, absolute: true })
  const sourcePackages = getSourcePackages(clientFiles)
  const excludePackages = getExcludePackages(sourcePackages, external, pluginPrefix)

  buildCheck({ cwd, packageJson, entry: 'client', files: clientFiles, log })

  const outDir = path.join(cwd, target_dir, 'client');

  const globals = excludePackages.reduce<Record<string, string>>((prev, curr) => {
    if (curr.startsWith('@nocobase')) {
      prev[`${curr}/client`] = curr;
    }
    prev[curr] = curr;
    return prev;
  }, {})

  const entry = fg.globSync('src/client/index.{ts,tsx,js,jsx}', { cwd, })
  const outputFileName = 'index.js';
  return viteBuild({
    mode: 'production',
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
    },
    logLevel: 'warn',
    build: {
      minify: false,
      outDir,
      cssCodeSplit: false,
      emptyOutDir: false,
      lib: {
        entry,
        formats: ['umd'],
        name: packageJson.name,
        fileName: () => outputFileName,
      },
      rollupOptions: {
        cache: true,
        external: Object.keys(globals),
        output: {
          exports: 'named',
          globals,
        },
      }
    },
    plugins: [
      react(),
      cssInjectedByJsPlugin({ styleId: packageJson.name }),
      {
        name: 'check-file-size',
        closeBundle() {
          const file = path.join(outDir, outputFileName);
          if (!fs.existsSync(file)) return;
          const fileSize = getFileSize(path.join(outDir, outputFileName));
          if (fileSize > 1024 * 1024) {
            log('The bundle file size exceeds 1MB %s. Please check for unnecessary %s and move them to %s if possible.\n', chalk.yellow(formatFileSize(fileSize)), chalk.yellow('dependencies'), chalk.yellow('devDependencies'));
          }
        },
      }
    ],
  })
}
