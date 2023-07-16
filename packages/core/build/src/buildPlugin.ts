import fs from 'fs';
import chalk from 'chalk';
import { builtinModules } from 'module';
import path from 'path';
import react from '@vitejs/plugin-react'
import { build as tsupBuild } from 'tsup'
import { build as viteBuild } from 'vite'
import fg from 'fast-glob'

const requireRegex = /require\s*\(\s*[`'"]([^`'"\s.].+?)[`'"]\s*\)/g;
const packageJsonRequireRegex = /require\((['"])\.\.\/+(\.\.\/)*package\.json\1\)/;
const importRegex = /import\s+.*?\s+from\s+['"]([^'"\s.].+?)['"];?/g;

const serverGlobalFiles: string[] = [
  'src/**',
  '!src/server/__tests__/**',
  '!src/client/**'
]

const clientGlobalFiles: string[] = [
  'src/client/**',
  '!src/client/__tests__/**',
]

type Log = (msg: string, ...args: any) => void;

function isNotBuiltinModule(packageName: string) {
  return !builtinModules.includes(packageName);
}

function getSourcePackages(sourceFiles: string[]): string[] {
  const packages = sourceFiles
    .map(item => fs.readFileSync(item, 'utf-8'))
    .map(item => [...item.matchAll(importRegex)])
    .flat()
    .map(item => item[1])
    .filter(isNotBuiltinModule)
    .map(item => {
      if (item.startsWith('@')) {
        // @aa/bb/ccFile => @aa/bb
        return item.split('/').slice(0, 2).join('/');
      }
      // aa/bbFile => aa
      item = item.split('/')[0];
    })
    .filter(Boolean)
  return [...new Set(packages)];
}

function getPackageJson(cwd: string) {
  return JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'), 'utf-8'));
}

function getPackageJsonPackages(packageJson: Record<string, any>): string[] {
  return [...Object.keys(packageJson.devDependencies || {}), ...Object.keys(packageJson.dependencies || {})];
}

function checkPackages(srcPackages: string[], packageJsonPackages: string[], log: Log) {
  const missingPackages = srcPackages.filter((packageName) => !packageJsonPackages.includes(packageName));
  if (missingPackages.length) {
    log("Missing packages %s in package.json. If you want it to be bundled into the output, put it in %s; otherwise, put it in %s.", chalk.red(missingPackages.join(', ')), chalk.grey('dependencies'), chalk.grey('devDependencies'));
    process.exit(-1);
  }
}

function checkRequire(sourceFiles: string[], packageJson: Record<string, any>, log: Log) {
  sourceFiles.forEach(item => {
    const code = fs.readFileSync(item, 'utf-8');
    const requireArr = [...code.matchAll(requireRegex), code.match(packageJsonRequireRegex)]
      .filter(Boolean)
      .map(item => item[0])
      .map(item => {
        if (item.startsWith('@')) {
          // @aa/bb/ccFile => @aa/bb
          return item.split('/').slice(0, 2).join('/');
        }
        // aa/bbFile => aa
        return item.split('/')[0];
      })
      .filter(item => packageJson?.dependencies(item));

    if (requireArr.length) {
      log('%s in %s is not allowed. Please use %s instead.', chalk.red(requireArr.join(', ')), chalk.red(item), chalk.red('import'));
      process.exit(-1);
    }
  })
}

function checkEntryExists(cwd: string, entry: 'server' | 'client', log: Log) {
  const srcDir = path.join(cwd, 'src', entry);
  if (!fs.existsSync(srcDir)) {
    log('Missing %s. Please create it.', chalk.red(`src/${entry}`));
    process.exit(-1);
  }

  return srcDir;
}

function tipDeps(sourcePackages: string[], packageJson: Record<string, any>, log: Log) {
  if (!packageJson.dependencies) return;
  const includePackages = sourcePackages.filter(item => packageJson.dependencies[item])
  if (!includePackages.length) return;
  log("%s will be bundled into dist. If you want it to be bundled into the output, put it in %s; otherwise, put it in %s.", chalk.yellow(includePackages.join(', ')), chalk.grey('dependencies'), chalk.grey('devDependencies'));
}

type CheckOptions = {
  cwd: string;
  log: Log;
  entry: 'server' | 'client';
  files: string[];
  packageJson: Record<string, any>;
}

function check(options: CheckOptions) {
  const { cwd, log, entry, files, packageJson } = options;
  checkEntryExists(cwd, entry, log)

  const sourcePackages = getSourcePackages(files);

  checkPackages(sourcePackages, getPackageJsonPackages(packageJson), log);
  checkRequire(files, packageJson, log);
  tipDeps(sourcePackages, packageJson, log)
}

function getFileSize(filePath: string) {
  const stat = fs.statSync(filePath);
  return stat.size;
}

function formatFileSize(fileSize: number) {
  const kb = fileSize / 1024;
  return kb.toFixed(2) + ' KB';
}

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
  check({ cwd, packageJson, entry: 'server', files: serverFiles, log })

  return tsupBuild({
    entry: serverFiles,
    splitting: false,
    clean: false,
    bundle: false,
    silent: true,
    treeshake: true,
    outDir: path.join(cwd, 'lib'),
    format: 'cjs',
    external: Object.keys(packageJson.devDependencies || {})
  })
}

export function buildPluginClient(cwd: string, log: Log) {
  log('build client')

  const packageJson = getPackageJson(cwd);
  const clientFiles = fg.globSync(clientGlobalFiles, { cwd, absolute: true })
  check({ cwd, packageJson, entry: 'client', files: clientFiles, log })

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
        external: [...Object.keys(externals), 'react/jsx-runtime'],
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
