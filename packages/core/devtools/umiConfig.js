const { existsSync } = require('fs');
const { resolve, sep } = require('path');
const packageJson = require('./package.json');
const fs = require('fs');
const glob = require('fast-glob');
const path = require('path');

console.log('VERSION: ', packageJson.version);

function getUmiConfig() {
  const { APP_PORT, API_BASE_URL, API_CLIENT_STORAGE_TYPE, API_CLIENT_STORAGE_PREFIX, APP_PUBLIC_PATH } = process.env;
  const API_BASE_PATH = process.env.API_BASE_PATH || '/api/';
  const PROXY_TARGET_URL = process.env.PROXY_TARGET_URL || `http://127.0.0.1:${APP_PORT}`;
  const LOCAL_STORAGE_BASE_URL = 'storage/uploads/';
  const STATIC_PATH = 'static/';

  function getLocalStorageProxy() {
    if (LOCAL_STORAGE_BASE_URL.startsWith('http')) {
      return {};
    }

    return {
      [APP_PUBLIC_PATH + LOCAL_STORAGE_BASE_URL]: {
        target: PROXY_TARGET_URL,
        changeOrigin: true,
      },
      [APP_PUBLIC_PATH + STATIC_PATH]: {
        target: PROXY_TARGET_URL,
        changeOrigin: true,
      },
    };
  }

  return {
    alias: getPackagePaths().reduce((memo, item) => {
      memo[item[0]] = item[1];
      return memo;
    }, {}),
    define: {
      'process.env.APP_PUBLIC_PATH': process.env.APP_PUBLIC_PATH,
      'process.env.WS_PATH': process.env.WS_PATH,
      'process.env.API_BASE_URL': API_BASE_URL || API_BASE_PATH,
      'process.env.API_CLIENT_STORAGE_PREFIX': API_CLIENT_STORAGE_PREFIX,
      'process.env.API_CLIENT_STORAGE_TYPE': API_CLIENT_STORAGE_TYPE,
      'process.env.APP_ENV': process.env.APP_ENV,
      'process.env.VERSION': packageJson.version,
      'process.env.WEBSOCKET_URL': process.env.WEBSOCKET_URL,
      'process.env.__E2E__': process.env.__E2E__,
    },
    // only proxy when using `umi dev`
    // if the assets are built, will not proxy
    proxy: {
      [API_BASE_PATH]: {
        target: PROXY_TARGET_URL,
        changeOrigin: true,
        pathRewrite: { [`^${API_BASE_PATH}`]: API_BASE_PATH },
        onProxyRes(proxyRes, req, res) {
          if (req.headers.accept === 'text/event-stream') {
            res.writeHead(res.statusCode, {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-transform',
              Connection: 'keep-alive',
            });
          }
        },
        onProxyReq: (proxyReq, req, res) => {
          if (req?.ip) {
            proxyReq.setHeader('X-Forwarded-For', req.ip);
          }
        },
      },
      // for local storage
      ...getLocalStorageProxy(),
    },
  };
}

function getNamespace() {
  const content = fs.readFileSync(resolve(process.cwd(), 'package.json'), 'utf-8');
  const json = JSON.parse(content);
  return json.name;
}

function getTsconfigPaths() {
  const content = fs.readFileSync(resolve(process.cwd(), 'tsconfig.paths.json'), 'utf-8');
  const json = JSON.parse(content);
  return json.compilerOptions.paths;
}

function getPackagePaths() {
  const paths = getTsconfigPaths();
  const pkgs = [];
  for (const key in paths) {
    if (Object.hasOwnProperty.call(paths, key)) {
      for (let dir of paths[key]) {
        if (dir.includes('*')) {
          const files = glob.sync(dir, { cwd: process.cwd(), onlyDirectories: true });
          for (const file of files) {
            const dirname = resolve(process.cwd(), file);
            if (existsSync(dirname)) {
              const re = new RegExp(dir.replace('*', '(.+)'));
              const p = dirname
                .substring(process.cwd().length + 1)
                .split(sep)
                .join('/');
              const match = re.exec(p);
              pkgs.push([key.replace('*', match?.[1]), dirname]);
            }
          }
        } else {
          const dirname = resolve(process.cwd(), dir);
          pkgs.push([key, dirname]);
        }
      }
    }
  }
  return pkgs;
}

function resolveNocobasePackagesAlias(config) {
  const pkgs = getPackagePaths();
  for (const [pkg, dir] of pkgs) {
    config.module.rules.get('ts-in-node_modules').include.add(dir);
    config.resolve.alias.set(pkg, dir);
  }
}

function getNodeModulesPath(packageDir) {
  const node_modules_dir = path.join(process.cwd(), 'node_modules');
  return path.join(node_modules_dir, packageDir);
}
class IndexGenerator {
  nocobaseDir = getNodeModulesPath('@nocobase');

  constructor(outputPath, pluginsPath) {
    this.outputPath = outputPath;
    this.pluginsPath = pluginsPath;
  }

  get indexPath() {
    return path.join(this.outputPath, 'index.ts');
  }

  get packageMapPath() {
    return path.join(this.outputPath, 'packageMap.json');
  }

  get packagesPath() {
    return path.join(this.outputPath, 'packages');
  }

  generate() {
    this.generatePluginContent();
    if (process.env.NODE_ENV === 'production') return;
    // this.pluginsPath.forEach((pluginPath) => {
    //   if (!fs.existsSync(pluginPath)) {
    //     return;
    //   }
    //   fs.watch(pluginPath, { recursive: false }, () => {
    //     this.generatePluginContent();
    //   });
    // });
  }

  get indexContent() {
    return `// @ts-nocheck
import packageMap from './packageMap.json';

function devDynamicImport(packageName: string): Promise<any> {
  const fileName = packageMap[packageName];
  if (!fileName) {
    return Promise.resolve(null);
  }
  try {
    return import(\`./packages/\${fileName}\`)
  } catch (error) {
    return Promise.resolve(null);
  }
}
export default devDynamicImport;`;
  }

  get emptyIndexContent() {
    return `
export default function devDynamicImport(packageName: string): Promise<any> {
  return Promise.resolve(null);
}`;
  }

  generatePluginContent() {
    if (fs.existsSync(this.outputPath)) {
      fs.rmSync(this.outputPath, { recursive: true, force: true });
    }
    fs.mkdirSync(this.outputPath, { recursive: true, force: true });
    const validPluginPaths = this.pluginsPath.filter((pluginsPath) => fs.existsSync(pluginsPath));
    if (!validPluginPaths.length || process.env.NODE_ENV === 'production') {
      fs.writeFileSync(this.indexPath, this.emptyIndexContent);
      return;
    }

    const pluginInfos = validPluginPaths.map((pluginsPath) => this.getContent(pluginsPath)).flat();

    // index.ts
    fs.writeFileSync(this.indexPath, this.indexContent);
    // packageMap.json
    const packageMapContent = pluginInfos.reduce((memo, item) => {
      memo[item.packageJsonName] = item.pluginFileName + '.ts';
      return memo;
    }, {});
    fs.writeFileSync(this.packageMapPath, JSON.stringify(packageMapContent, null, 2));
    // packages
    fs.mkdirSync(this.packagesPath, { recursive: true });
    pluginInfos.forEach((item) => {
      const pluginPackagePath = path.join(this.packagesPath, item.pluginFileName + '.ts');
      fs.writeFileSync(pluginPackagePath, item.exportStatement);
    });
  }

  getContent(pluginsPath) {
    const pluginFolders = glob.sync(['*/package.json', '*/*/package.json'], {
      cwd: pluginsPath,
      onlyFiles: true,
      absolute: true,
    });

    const storagePluginFolders = glob.sync(['*/package.json', '*/*/package.json'], {
      cwd: process.env.PLUGIN_STORAGE_PATH,
      onlyFiles: true,
      absolute: true,
    });

    const nocobasePluginFolders = glob
      .sync(['plugin-*/package.json'], { cwd: this.nocobaseDir, onlyFiles: true, absolute: true })
      .map((item) => fs.realpathSync(item));
    const pluginInfos = Array.from(new Set([...pluginFolders, ...storagePluginFolders, ...nocobasePluginFolders]))
      .filter((item) => {
        const dirname = path.dirname(item);
        const clientJs = path.join(dirname, 'client.js');
        return fs.existsSync(clientJs);
      })
      .map((pluginPackageJsonPath) => {
        const pluginPackageJson = require(pluginPackageJsonPath);
        const pluginPathArr = pluginPackageJsonPath.replaceAll(path.sep, '/').split('/');
        const hasNamespace = pluginPathArr[pluginPathArr.length - 3].startsWith('@');
        const pluginFileName = (hasNamespace
          ? `${pluginPathArr[pluginPathArr.length - 3].replace('@', '')}_${pluginPathArr[pluginPathArr.length - 2]}`
          : pluginPathArr[pluginPathArr.length - 2]
        ).replaceAll('-', '_');

        let exportStatement = '';
        if (pluginPackageJsonPath.includes('packages')) {
          const pluginSrcClientPath = path
            .relative(this.packagesPath, path.join(path.dirname(pluginPackageJsonPath), 'src', 'client'))
            .replaceAll(path.sep, '/');
          exportStatement = `export { default } from '${pluginSrcClientPath}';`;
        } else {
          exportStatement = `export { default } from '${pluginPackageJson.name}/client';`;
        }
        return { exportStatement, pluginFileName, packageJsonName: pluginPackageJson.name };
      });

    return pluginInfos;
  }
}

exports.getUmiConfig = getUmiConfig;
exports.resolveNocobasePackagesAlias = resolveNocobasePackagesAlias;
exports.IndexGenerator = IndexGenerator;

exports.generatePlugins = function () {
  const pluginDirs = (process.env.PLUGIN_PATH || 'packages/plugins/,packages/samples/,packages/pro-plugins/')
    .split(',')
    .map((item) => path.join(process.cwd(), item));

  const outputPluginPath = path.join(process.env.APP_PACKAGE_ROOT, 'client', 'src', '.plugins');
  const indexGenerator = new IndexGenerator(outputPluginPath, pluginDirs);
  indexGenerator.generate();
};
