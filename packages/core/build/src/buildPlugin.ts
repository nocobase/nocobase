import fs from 'fs';
import chalk from 'chalk';
import path from 'path';
import execa from 'execa'
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
  'lodash',

  // others
  'china-division'
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

  const dependencies = getDepsConfig(cwd, includePackages);

  const outputDir = path.join(cwd, target_dir);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  const outputPackageJson = path.join(outputDir, 'package.json');
  const oldPackageJson = path.join(outputDir, 'node_modules', '_package.json');
  const content = JSON.stringify({
    name: 'plugin-tmp',
    version: '1.0.0',
    dependencies
  });

  if (fs.existsSync(oldPackageJson)) {
    const oldContent = fs.readFileSync(oldPackageJson, 'utf-8');
    if (oldContent === content) return;
  }

  fs.writeFileSync(outputPackageJson, content, 'utf-8')

  execa.sync('yarn', ['install', '--production', '--non-interactive'], {
    cwd: outputDir,
  })

  fs.renameSync(outputPackageJson, oldPackageJson)
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
            log('The bundle file size exceeds 1MB %s. ', chalk.red(formatFileSize(fileSize)));
          }
        },
      }
    ],
  })
}
