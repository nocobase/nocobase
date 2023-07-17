import fs from 'fs';
import chalk from 'chalk';
import { builtinModules } from 'module';
import path from 'path';
import react from '@vitejs/plugin-react'
import { build as tsupBuild } from 'tsup'
import { build as viteBuild } from 'vite'
import fg from 'fast-glob'
import { buildCheck, formatFileSize, getFileSize, getPackageJson } from './utils/buildCheck';


const serverGlobalFiles: string[] = [
  'src/**',
  '!src/server/__tests__/**',
  '!src/client/**'
]

const clientGlobalFiles: string[] = [
  'src/client/**',
  '!src/client/__tests__/**',
]

const shouldDevDependencies = [
  'react',
  'react-dom',
  'react-router',
  'react-router-dom',
  'antd',
  'antd-style',
  '@ant-design/icons',
  '@ant-design/cssinjs',
  'i18next',
  'react-i18next',
  '@formily/antd-v5',
  '@formily/core',
  '@formily/react',
  '@formily/shared',
  '@formily/json-schema',
  '@formily/reactive',
  '@nocobase/acl',
  '@nocobase/actions',
  '@nocobase/auth',
  '@nocobase/cache',
  '@nocobase/database',
  '@nocobase/evaluators',
  '@nocobase/logger',
  '@nocobase/resourcer',
  '@nocobase/utils',
  'mysql',
  'pg',
  'pg-hstore',
  'sqlite3'
]

type Log = (msg: string, ...args: any) => void;

export function deleteJsFiles(cwd: string, log: Log) {
  log('delete babel js files')
  const jsFiles = fg.globSync(['**/*', '!**/*.d.ts'], { cwd: path.join(cwd, 'lib'), absolute: true })
  jsFiles.forEach(item => {
    fs.unlinkSync(item);
  })
}

export function buildPluginServer(cwd: string, log: Log) {
  log('build server')
  const packageJson = getPackageJson(cwd);
  const serverFiles = fg.globSync(serverGlobalFiles, { cwd, absolute: true })
  buildCheck({ cwd, packageJson, entry: 'server', shouldDevDependencies, files: serverFiles, log })

  return tsupBuild({
    entry: serverFiles,
    splitting: false,
    clean: false,
    bundle: false,
    silent: true,
    treeshake: true,
    outDir: path.join(cwd, 'lib'),
    format: 'cjs',
    external: [...new Set([...Object.keys(packageJson.devDependencies || {}), ...shouldDevDependencies])]
  })
}

export function buildPluginClient(cwd: string, log: Log) {
  log('build client')

  const packageJson = getPackageJson(cwd);
  const clientFiles = fg.globSync(clientGlobalFiles, { cwd, absolute: true })
  buildCheck({ cwd, packageJson, entry: 'client', shouldDevDependencies, files: clientFiles, log })

  const outDir = path.join(cwd, 'lib/client');

  const externals = Object.keys(packageJson.devDependencies || {}).reduce<Record<string, string>>((prev, curr) => {
    prev[`${curr}/client`] = curr;
    prev[curr] = curr;
    return prev;
  }, {})

  const entry = fg.globSync('src/client/index.{ts,tsx,js,jsx}', { cwd })
  const outputFileName = 'index.js';
  return viteBuild({
    mode: 'production',
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
    },
    logLevel: 'error',
    build: {
      minify: false,
      outDir,
      lib: {
        entry,
        formats: ['umd'],
        name: packageJson.name,
        fileName: () => outputFileName,
      },
      rollupOptions: {
        external: [...new Set([...Object.keys(externals), ...shouldDevDependencies])],
        output: {
          exports: 'named',
          globals: {
            ...externals,
            'react/jsx-runtime': 'jsxRuntime',
          }
        },
      }
    },
    plugins: [
      react(),
      {
        name: 'check-file-size',
        closeBundle() {
          const fileSize = getFileSize(path.join(outDir, outputFileName));
          if (fileSize > 1024 * 1024) {
            log('The bundle file size exceeds 1MB %s. Please check for unnecessary %s and move them to %s if possible.\n', chalk.yellow(formatFileSize(fileSize)), chalk.yellow('dependencies'), chalk.yellow('devDependencies'));
          }
        },
      }],
  })
}
