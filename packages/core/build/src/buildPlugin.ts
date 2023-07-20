import fs from 'fs';
import chalk from 'chalk';
import ncc from '@vercel/ncc';
import path from 'path';
import react from '@vitejs/plugin-react'
import { build as tsupBuild } from 'tsup'
import { build as viteBuild } from 'vite'
import fg from 'fast-glob'
import { buildCheck, formatFileSize, getFileSize, getPackageJson, getSourcePackages } from './utils/buildPluginUtils';
import { getDepsConfig } from './utils/getDepsConfig';

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
  'react/jsx-runtime',
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
  const jsFiles = fg.globSync(['**/*', '!**/*.d.ts', '!node_modules'], { cwd: path.join(cwd, 'lib'), absolute: true })
  jsFiles.forEach(item => {
    fs.unlinkSync(item);
  })
}

export async function buildServerDeps(cwd: string, serverFiles: string[], packageJson: Record<string, any>, log: Log) {
  log('build server dependencies')
  const external = [...new Set([...Object.keys(packageJson.devDependencies || {}), ...shouldDevDependencies])]
  const outDir = path.join(cwd, 'lib', 'node_modules');

  const packages = packageJson.dependencies ?
    getSourcePackages(serverFiles)
      .filter(packageName => packageJson.dependencies[packageName])
      .filter(packageName => !shouldDevDependencies[packageName]) : [];

  if (!packages.length) return;

  log("%s will be bundled. If you want it to be bundled into the output, put it in %s; otherwise, put it in %s.", chalk.yellow(packages.join(', ')), chalk.bold('dependencies'), chalk.bold('devDependencies'));

  const deps = getDepsConfig(cwd, outDir, packages, external);

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
  buildCheck({ cwd, packageJson, entry: 'server', shouldDevDependencies, files: serverFiles, log })

  await tsupBuild({
    entry: serverFiles,
    splitting: false,
    clean: false,
    bundle: false,
    silent: true,
    treeshake: true,
    target: 'node16',
    outDir: path.join(cwd, 'lib'),
    format: 'cjs',
    skipNodeModulesBundle: true
  })

  await buildServerDeps(cwd, serverFiles, packageJson, log)
}

export function buildPluginClient(cwd: string, log: Log) {
  log('build client')

  const packageJson = getPackageJson(cwd);
  const clientFiles = fg.globSync(clientGlobalFiles, { cwd, absolute: true })
  buildCheck({ cwd, packageJson, entry: 'client', shouldDevDependencies, files: clientFiles, log })

  const outDir = path.join(cwd, 'lib/client');

  const globals = [...new Set([...Object.keys(packageJson.devDependencies || {}), ...shouldDevDependencies])].reduce<Record<string, string>>((prev, curr) => {
    if (curr.startsWith('@nocobase')) {
      prev[`${curr}/client`] = curr;
    }
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
