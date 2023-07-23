const { existsSync } = require('fs');
const { resolve, sep } = require('path');
const packageJson = require('./package.json');
const fs = require('fs');
const glob = require('glob');
const path = require('path');

console.log('VERSION: ', packageJson.version);

function getUmiConfig() {
  const { APP_PORT, API_BASE_URL } = process.env;
  const API_BASE_PATH = process.env.API_BASE_PATH || '/api/';
  const PROXY_TARGET_URL = process.env.PROXY_TARGET_URL || `http://127.0.0.1:${APP_PORT}`;
  const LOCAL_STORAGE_BASE_URL = process.env.LOCAL_STORAGE_BASE_URL || '/storage/uploads/';

  function getLocalStorageProxy() {
    if (LOCAL_STORAGE_BASE_URL.startsWith('http')) {
      return {};
    }

    return {
      [LOCAL_STORAGE_BASE_URL]: {
        target: PROXY_TARGET_URL,
        changeOrigin: true,
      },
    };
  }

  return {
    alias: getPackagePaths().reduce((memo, item) => {
      memo[item[0]] = item[1]
      return memo
    }, {}),
    define: {
      'process.env.API_BASE_URL': API_BASE_URL || API_BASE_PATH,
      'process.env.APP_ENV': process.env.APP_ENV,
      'process.env.VERSION': packageJson.version,
    },
    // only proxy when using `umi dev`
    // if the assets are built, will not proxy
    proxy: {
      [API_BASE_PATH]: {
        target: PROXY_TARGET_URL,
        changeOrigin: true,
        pathRewrite: { [`^${API_BASE_PATH}`]: API_BASE_PATH },
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
  const content = fs.readFileSync(resolve(process.cwd(), 'tsconfig.json'), 'utf-8');
  const json = JSON.parse(content);
  return json.compilerOptions.paths;
}

function getPackagePaths() {
  const paths = getTsconfigPaths();
  const pkgs = [];
  for (const key in paths) {
    if (Object.hasOwnProperty.call(paths, key)) {
      const dir = paths[key][0];
      if (dir.includes('*')) {
        const files = glob.sync(dir);
        for (const file of files) {
          const dirname = resolve(process.cwd(), file);
          if (existsSync(dirname)) {
            const re = new RegExp(dir.replace('*', '(.+)'));
            const p = dirname.substring(process.cwd().length + 1).split(sep).join('/');
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
  return pkgs;
}

function resolveNocobasePackagesAlias(config) {
  const pkgs = getPackagePaths();
  for (const [pkg, dir] of pkgs) {
    config.module.rules.get('ts-in-node_modules').include.add(dir);
    config.resolve.alias.set(pkg, dir);
  }
}

class IndexGenerator {
  constructor(outputPath, pluginsPath) {
    this.outputPath = outputPath;
    this.pluginsPath = pluginsPath;
  }

  generate() {
    this.generatePluginIndex();
    if (process.env.NODE_ENV === 'production') return;
    this.pluginsPath.forEach((pluginPath) => {
      fs.watch(pluginPath, { recursive: false }, () => {
        this.generatePluginIndex();
      })
    });
  }

  generatePluginIndex() {
    const validPluginPaths = this.pluginsPath.filter((pluginPath) => fs.existsSync(pluginPath))
    if (!validPluginPaths.length) {
      return;
    }
    if (!fs.existsSync(this.outputPath)) {
      fs.mkdirSync(path.dirname(this.outputPath), { recursive: true });
    }
    if (process.env.NODE_ENV === 'production') {
      fs.writeFileSync(this.outputPath, 'export default {}');
      return;
    }
    const pluginInfo = validPluginPaths.map(pluginPath => this.getContent(pluginPath));
    const importContent = pluginInfo.map(({ indexContent }) => indexContent).join('\n');
    const exportContent = pluginInfo.map(({ exportContent }) => exportContent).join('\n');

    const fileContent = `${importContent}\n\nexport default {\n${exportContent}\n}`;

    fs.writeFileSync(this.outputPath, fileContent);
  }

  getContent(pluginPath) {
    const pluginFolders = fs.readdirSync(pluginPath);
    const pluginImports = pluginFolders.filter((folder) => {
      const pluginPackageJsonPath = path.join(pluginPath, folder, 'package.json');
      const pluginSrcClientPath = path.join(pluginPath, folder, 'src', 'client');
      return fs.existsSync(pluginPackageJsonPath) && fs.existsSync(pluginSrcClientPath);
    }).map((folder, index) => {
      const pluginPackageJsonPath = path.join(pluginPath, folder, 'package.json');
      const pluginPackageJson = require(pluginPackageJsonPath);
      const pluginSrcClientPath = path.relative(path.dirname(this.outputPath), path.join(pluginPath, folder, 'src', 'client')).replaceAll('\\', '/');
      const pluginName = `${folder.replaceAll('-', '_')}${index}`
      const importStatement = `import ${pluginName} from '${pluginSrcClientPath}';`;
      return { importStatement, pluginName, packageJsonName: pluginPackageJson.name };
    });

    const indexContent = pluginImports
      .map(({ importStatement }) => importStatement)
      .join('\n');

    const exportContent = pluginImports
      .map(({ pluginName, packageJsonName }) => `  "${packageJsonName}": ${pluginName},`)
      .join('\n');

    return {
      indexContent,
      exportContent,
    }
  }
}

exports.getUmiConfig = getUmiConfig;
exports.resolveNocobasePackagesAlias = resolveNocobasePackagesAlias;
exports.IndexGenerator = IndexGenerator;
