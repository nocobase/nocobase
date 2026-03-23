const { existsSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } = require('node:fs');
const { dirname, join, relative, resolve, sep } = require('node:path');
const glob = require('fast-glob');

function getTsconfigPaths() {
  const content = readFileSync(resolve(process.cwd(), 'tsconfig.paths.json'), 'utf-8');
  const json = JSON.parse(content);
  return json.compilerOptions.paths;
}

function getPackagePaths() {
  const paths = getTsconfigPaths();
  const pkgs = [];
  for (const key in paths) {
    if (Object.hasOwnProperty.call(paths, key)) {
      for (const dir of paths[key]) {
        if (dir.includes('*')) {
          const files = glob.sync(dir, { cwd: process.cwd(), onlyDirectories: true });
          for (const file of files) {
            const dirname = resolve(process.cwd(), file);
            if (existsSync(dirname)) {
              const re = new RegExp(dir.replace('*', '(.+)'));
              const normalized = dirname
                .substring(process.cwd().length + 1)
                .split(sep)
                .join('/');
              const match = re.exec(normalized);
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

function getNodeModulesPath(packageDir) {
  return join(process.cwd(), 'node_modules', packageDir);
}

class IndexGenerator {
  nocobaseDir = getNodeModulesPath('@nocobase');

  constructor(outputPath, pluginsPath, options = {}) {
    this.outputPath = outputPath;
    this.pluginsPath = pluginsPath;
    this.options = {
      clientModuleName: 'client',
      clientRootFile: 'client.js',
      clientSourceDir: 'client',
      ...options,
    };
  }

  get indexPath() {
    return join(this.outputPath, 'index.ts');
  }

  get packageMapPath() {
    return join(this.outputPath, 'packageMap.json');
  }

  get packagesPath() {
    return join(this.outputPath, 'packages');
  }

  generate() {
    this.generatePluginContent();
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
    if (existsSync(this.outputPath)) {
      rmSync(this.outputPath, { recursive: true, force: true });
    }
    mkdirSync(this.outputPath, { recursive: true });
    const validPluginPaths = this.pluginsPath.filter((pluginsPath) => existsSync(pluginsPath));
    if (!validPluginPaths.length || process.env.NODE_ENV === 'production') {
      writeFileSync(this.indexPath, this.emptyIndexContent);
      return;
    }

    const pluginInfos = validPluginPaths.map((pluginsPath) => this.getContent(pluginsPath)).flat();

    writeFileSync(this.indexPath, this.indexContent);
    const packageMapContent = pluginInfos.reduce((memo, item) => {
      memo[item.packageJsonName] = `${item.pluginFileName}.ts`;
      return memo;
    }, {});
    writeFileSync(this.packageMapPath, JSON.stringify(packageMapContent, null, 2));
    mkdirSync(this.packagesPath, { recursive: true });
    pluginInfos.forEach((item) => {
      const pluginPackagePath = join(this.packagesPath, `${item.pluginFileName}.ts`);
      writeFileSync(pluginPackagePath, item.exportStatement);
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
      .map((item) => realpathSync(item));

    return Array.from(new Set([...pluginFolders, ...storagePluginFolders, ...nocobasePluginFolders]))
      .filter((item) => {
        const pluginDir = dirname(item);
        const clientJs = join(pluginDir, this.options.clientRootFile);
        return existsSync(clientJs);
      })
      .map((pluginPackageJsonPath) => {
        const pluginPackageJson = require(pluginPackageJsonPath);
        const pluginPathArr = pluginPackageJsonPath.replaceAll(sep, '/').split('/');
        const hasNamespace = pluginPathArr[pluginPathArr.length - 3].startsWith('@');
        const pluginFileName = (hasNamespace
          ? `${pluginPathArr[pluginPathArr.length - 3].replace('@', '')}_${pluginPathArr[pluginPathArr.length - 2]}`
          : pluginPathArr[pluginPathArr.length - 2]
        ).replaceAll('-', '_');

        let exportStatement = '';
        if (pluginPackageJsonPath.includes('packages')) {
          const pluginSrcClientPath = relative(
            this.packagesPath,
            join(dirname(pluginPackageJsonPath), 'src', this.options.clientSourceDir),
          ).replaceAll(sep, '/');
          exportStatement = `export { default } from '${pluginSrcClientPath}';`;
        } else {
          exportStatement = `export { default } from '${pluginPackageJson.name}/${this.options.clientModuleName}';`;
        }

        return { exportStatement, pluginFileName, packageJsonName: pluginPackageJson.name };
      });
  }
}

function getPluginDirs() {
  return (process.env.PLUGIN_PATH || 'packages/plugins/,packages/samples/,packages/pro-plugins/')
    .split(',')
    .map((item) => join(process.cwd(), item));
}

function generatePluginsByOutputPath(outputPluginPath, options = {}) {
  const pluginDirs = getPluginDirs();
  const indexGenerator = new IndexGenerator(outputPluginPath, pluginDirs, options);
  indexGenerator.generate();
}

function generatePlugins() {
  generatePluginsByOutputPath(join(process.env.APP_PACKAGE_ROOT, 'client', 'src', '.plugins'));
}

function generateV2Plugins() {
  generatePluginsByOutputPath(join(process.env.APP_PACKAGE_ROOT, 'client-v2', 'src', '.plugins'), {
    clientModuleName: 'client-v2',
    clientRootFile: 'client-v2.js',
    clientSourceDir: 'client-v2',
  });
}

function generateAllPlugins() {
  [
    join(process.env.APP_PACKAGE_ROOT, 'client', 'src', '.plugins'),
    join(process.env.APP_PACKAGE_ROOT, 'client-v2', 'src', '.plugins'),
  ].forEach((outputPluginPath) => {
    generatePluginsByOutputPath(outputPluginPath);
  });
}

exports.getPackagePaths = getPackagePaths;
exports.IndexGenerator = IndexGenerator;
exports.generatePlugins = generatePlugins;
exports.generateV2Plugins = generateV2Plugins;
exports.generateAllPlugins = generateAllPlugins;
