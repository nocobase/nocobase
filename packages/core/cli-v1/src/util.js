/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const net = require('net');
const chalk = require('chalk');
const execa = require('execa');
const fg = require('fast-glob');
const { dirname, join, resolve, sep, isAbsolute } = require('path');
const { readFile, writeFile } = require('fs').promises;
const { existsSync, mkdirSync, cpSync, writeFileSync } = require('fs');
const dotenv = require('dotenv');
const fs = require('fs-extra');
const os = require('os');
const moment = require('moment-timezone');
const { resolvePluginStoragePath } = require('@nocobase/utils/plugin-symlink');

exports.isPackageValid = (pkg) => {
  try {
    require.resolve(pkg);
    return true;
  } catch (error) {
    return false;
  }
};

exports.hasCorePackages = () => {
  const coreDir = resolve(process.cwd(), 'packages/core/build');
  return existsSync(coreDir);
};

exports.hasTsNode = () => {
  return exports.isPackageValid('ts-node/dist/bin');
};

exports.isDev = function isDev() {
  if (process.env.APP_ENV === 'production') {
    return false;
  }
  return exports.hasTsNode();
};

const isProd = () => {
  const { APP_PACKAGE_ROOT } = process.env;
  const file = `${APP_PACKAGE_ROOT}/lib/index.js`;
  if (!existsSync(resolve(process.cwd(), file))) {
    console.log('For production environment, please build the code first.');
    console.log();
    console.log(chalk.yellow('$ yarn build'));
    console.log();
    process.exit(1);
  }
  return true;
};

exports.isProd = isProd;

exports.nodeCheck = () => {
  if (!exports.hasTsNode()) {
    console.log('Please install all dependencies');
    console.log(chalk.yellow('$ yarn install'));
    process.exit(1);
  }
};

exports.run = (command, args, options = {}) => {
  if (command === 'tsx') {
    command = 'node';
    args = ['./node_modules/tsx/dist/cli.mjs'].concat(args || []);
  }
  return execa(command, args, {
    shell: true,
    stdio: 'inherit',
    ...options,
    env: {
      ...process.env,
      ...options.env,
    },
  });
};

function colorizedDevLogEnv(env = process.env, overrides = {}) {
  const nextEnv = {
    ...env,
    ...overrides,
  };
  delete nextEnv.NO_COLOR;
  if (!nextEnv.FORCE_COLOR) {
    nextEnv.FORCE_COLOR = '1';
  }
  return nextEnv;
}

function createRunWithPrefixLabel(prefix, color) {
  const forcedChalk = new chalk.Instance({ level: 1 });
  const colorize = forcedChalk[color] || forcedChalk.cyan;
  return colorize(`[${prefix}]`);
}

exports.runWithPrefix = (command, args, options = {}) => {
  if (command === 'tsx') {
    command = 'node';
    args = ['./node_modules/tsx/dist/cli.mjs'].concat(args || []);
  }

  const prefix = options.prefix || 'process';
  const color = options.color || 'cyan';
  const label = createRunWithPrefixLabel(prefix, color);
  const subprocess = execa(command, args, {
    shell: true,
    stdio: 'pipe',
    ...options,
    env: colorizedDevLogEnv(process.env, options.env),
  });

  const writePrefixed = (chunk, writer) => {
    const text = chunk.toString();
    const lines = text.split(/\r?\n/);
    const trailingNewline = text.endsWith('\n') || text.endsWith('\r');

    lines.forEach((line, index) => {
      if (!line && index === lines.length - 1 && trailingNewline) {
        return;
      }
      writer.write(`${label} ${line}\n`);
    });
  };

  subprocess.stdout?.on('data', (chunk) => writePrefixed(chunk, process.stdout));
  subprocess.stderr?.on('data', (chunk) => writePrefixed(chunk, process.stderr));

  return subprocess;
};

exports._test = {
  createRunWithPrefixLabel,
  colorizedDevLogEnv,
};

exports.colorizedDevLogEnv = colorizedDevLogEnv;

exports.isPortReachable = async (port, { timeout = 1000, host } = {}) => {
  const promise = new Promise((resolve, reject) => {
    const socket = new net.Socket();

    const onError = () => {
      socket.destroy();
      reject();
    };

    socket.setTimeout(timeout);
    socket.once('error', onError);
    socket.once('timeout', onError);

    socket.connect(port, host, () => {
      socket.end();
      resolve();
    });
  });

  try {
    await promise;
    return true;
  } catch (_) {
    return false;
  }
};

exports.postCheck = async (opts) => {
  const port = opts.port || process.env.APP_PORT;
  const result = await exports.isPortReachable(port);
  if (result) {
    console.error(chalk.red(`Port ${port} already in use`));
    process.exit(1);
  }
};

exports.runInstall = async () => {
  const { APP_PACKAGE_ROOT, SERVER_TSCONFIG_PATH } = process.env;

  if (exports.isDev()) {
    const argv = [
      '--tsconfig',
      SERVER_TSCONFIG_PATH,
      '-r',
      'tsconfig-paths/register',
      `${APP_PACKAGE_ROOT}/src/index.ts`,
      'install',
      '-s',
    ];
    await exports.run('tsx', argv);
  } else if (isProd()) {
    const file = `${APP_PACKAGE_ROOT}/lib/index.js`;
    const argv = [file, 'install', '-s'];
    await exports.run('node', argv);
  }
};

exports.runAppCommand = async (command, args = []) => {
  const { APP_PACKAGE_ROOT, SERVER_TSCONFIG_PATH } = process.env;

  if (exports.isDev()) {
    const argv = [
      '--tsconfig',
      SERVER_TSCONFIG_PATH,
      '-r',
      'tsconfig-paths/register',
      `${APP_PACKAGE_ROOT}/src/index.ts`,
      command,
      ...args,
    ];
    await exports.run('tsx', argv);
  } else if (isProd()) {
    const argv = [`${APP_PACKAGE_ROOT}/lib/index.js`, command, ...args];
    await exports.run('node', argv);
  }
};

exports.promptForTs = () => {
  if (process.env.LOGGER_SILENT === 'true') {
    return;
  }
  console.log(chalk.green('WAIT: ') + 'TypeScript compiling...');
};

exports.downloadPro = async () => {
  // 此处不再判定，由pkgg命令处理
  // const { NOCOBASE_PKG_USERNAME, NOCOBASE_PKG_PASSWORD } = process.env;
  // if (!(NOCOBASE_PKG_USERNAME && NOCOBASE_PKG_PASSWORD)) {
  //   return;
  // }
  await exports.run('yarn', ['nocobase', 'pkg', 'download-pro']);
};

exports.updateJsonFile = async (target, fn) => {
  const content = await readFile(target, 'utf-8');
  const json = JSON.parse(content);
  await writeFile(target, JSON.stringify(fn(json), null, 2), 'utf-8');
};

exports.getVersion = async () => {
  const { stdout } = await execa('npm', ['v', '@nocobase/app-server', 'versions']);
  const versions = new Function(`return (${stdout})`)();
  return versions[versions.length - 1];
};

function normalizeAppDevClientRsbuildConfig(appDevDir) {
  const configPath = resolve(appDevDir, 'client/rsbuild.config.ts');
  if (!existsSync(configPath)) {
    return;
  }
  const content = fs.readFileSync(configPath, 'utf-8');
  const normalized = content.replace(
    "require('../../devtools/package.json')",
    "require('@nocobase/devtools/package.json')",
  );
  if (normalized !== content) {
    fs.writeFileSync(configPath, normalized, 'utf-8');
  }
}

function normalizeAppDevClientV2Tsconfig(appDevDir) {
  const tsconfigPath = resolve(appDevDir, 'client-v2/tsconfig.json');
  if (!existsSync(tsconfigPath)) {
    return;
  }
  const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
  tsconfig.extends = '../../../tsconfig.json';
  tsconfig.compilerOptions = tsconfig.compilerOptions || {};
  tsconfig.compilerOptions.baseUrl = '../../../';
  fs.writeFileSync(tsconfigPath, `${JSON.stringify(tsconfig, null, 2)}\n`, 'utf-8');
}

function normalizeAppDevFiles(appDevDir) {
  normalizeAppDevClientRsbuildConfig(appDevDir);
  normalizeAppDevClientV2Tsconfig(appDevDir);
}

exports.generateAppDir = function generateAppDir() {
  const appPkgPath = dirname(dirname(require.resolve('@nocobase/app/src/index.ts')));
  const appDevDir = storagePathJoin('.app-dev');
  if (exports.isDev() && !exports.hasCorePackages() && appPkgPath.includes('node_modules')) {
    if (!existsSync(appDevDir)) {
      mkdirSync(appDevDir, { force: true, recursive: true });
      cpSync(appPkgPath, appDevDir, {
        recursive: true,
        force: true,
      });
    }
    normalizeAppDevFiles(appDevDir);
    process.env.APP_PACKAGE_ROOT = appDevDir;
  } else {
    process.env.APP_PACKAGE_ROOT = appPkgPath;
  }
  buildIndexHtml();
};

exports.genTsConfigPaths = function genTsConfigPaths() {
  try {
    fs.unlinkSync(resolve(process.cwd(), 'node_modules/.bin/tsx'));
    fs.symlinkSync(
      resolve(process.cwd(), 'node_modules/tsx/dist/cli.mjs'),
      resolve(process.cwd(), 'node_modules/.bin/tsx'),
      'file',
    );
  } catch (error) {
    //
  }

  const cwd = process.cwd();
  const cwdLength = cwd.length;
  const paths = {
    '@docs/*': ['docs/docs/*'],
    '@@/*': ['.dumi/tmp/*'],
  };
  const packages = fg.sync(['packages/*/*/package.json', 'packages/*/*/*/package.json'], {
    absolute: true,
    onlyFiles: true,
  });
  packages.forEach((packageFile) => {
    const packageJsonName = require(packageFile).name;
    const packageDir = dirname(packageFile);
    const relativePath = packageDir
      .slice(cwdLength + 1)
      .split(sep)
      .join('/');
    paths[`${packageJsonName}/client`] = [`${relativePath}/src/client`];
    paths[`${packageJsonName}/client-v2`] = [`${relativePath}/src/client-v2`];
    paths[`${packageJsonName}/package.json`] = [`${relativePath}/package.json`];
    paths[packageJsonName] = [`${relativePath}/src`];
    if (packageJsonName === '@nocobase/test') {
      paths[`${packageJsonName}/server`] = [`${relativePath}/src/server`];
      paths[`${packageJsonName}/e2e`] = [`${relativePath}/src/e2e`];
      paths[`${packageJsonName}/web`] = [`${relativePath}/src/web`];
    }
    if (packageJsonName === '@nocobase/client') {
      paths[`${packageJsonName}/demo-utils`] = [`${relativePath}/src/demo-utils`];
    }
    if (packageJsonName === '@nocobase/plugin-workflow-test') {
      paths[`${packageJsonName}/e2e`] = [`${relativePath}/src/e2e`];
    }
    if (packageJsonName === '@nocobase/light-extension-sdk') {
      paths[`${packageJsonName}/schema`] = [`${relativePath}/src/schema`];
      paths[`${packageJsonName}/schema/server`] = [`${relativePath}/src/schema/server`];
      paths[`${packageJsonName}/shared`] = [`${relativePath}/src/shared`];
      paths[`${packageJsonName}/typegen`] = [`${relativePath}/src/typegen`];
    }
    if (packageJsonName === '@nocobase/runjs') {
      paths[`${packageJsonName}/compiler`] = [`${relativePath}/src/compiler`];
      paths[`${packageJsonName}/settings`] = [`${relativePath}/src/settings`];
    }
  });

  const tsConfigJsonPath = join(cwd, './tsconfig.paths.json');
  const content = { compilerOptions: { paths } };
  writeFileSync(tsConfigJsonPath, JSON.stringify(content, null, 2), 'utf-8');
  return content;
};

function generatePlaywrightPath(clean = false) {
  try {
    const playwright = storagePathJoin('playwright', 'tests');
    if (clean && fs.existsSync(playwright)) {
      fs.rmSync(dirname(playwright), { force: true, recursive: true });
    }
    if (!fs.existsSync(playwright)) {
      const testPkg = require.resolve('@nocobase/test/package.json');
      fs.cpSync(resolve(dirname(testPkg), 'playwright/tests'), playwright, { recursive: true });
    }
  } catch (error) {
    // empty
  }
}

exports.generatePlaywrightPath = generatePlaywrightPath;

function parseEnv(name) {
  if (name === 'DB_UNDERSCORED') {
    if (process.env.DB_UNDERSCORED === 'true') {
      return 'true';
    }
    if (process.env.DB_UNDERSCORED) {
      return 'true';
    }
    return 'false';
  }
}

function resolvePublicPath(appPublicPath = '/') {
  const normalized = String(appPublicPath || '/').trim() || '/';
  const withLeadingSlash = normalized.startsWith('/') ? normalized : `/${normalized}`;
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`;
}

exports.resolvePublicPath = resolvePublicPath;

function resolveDistPublicPath(appPublicPath = '/') {
  const publicPath = resolvePublicPath(appPublicPath).replace(/\/+$/, '');
  return `${publicPath}/dist/`;
}

function buildDefaultCdnBaseUrl(appPublicPath, version) {
  const normalizedVersion = String(version || '')
    .trim()
    .replace(/^\/+|\/+$/g, '');
  if (!normalizedVersion) {
    return undefined;
  }
  return `${resolveDistPublicPath(appPublicPath)}${normalizedVersion}/`;
}

exports.buildDefaultCdnBaseUrl = buildDefaultCdnBaseUrl;

function resolveDefaultCdnBaseUrlFromActiveVersion(appPublicPath = '/') {
  try {
    const activeVersionFile = storagePathJoin('dist-client', 'active-version');
    if (!fs.existsSync(activeVersionFile)) {
      return undefined;
    }
    const activeVersion = String(fs.readFileSync(activeVersionFile, 'utf8') || '').trim();
    return buildDefaultCdnBaseUrl(appPublicPath, activeVersion);
  } catch (_error) {
    return undefined;
  }
}

exports.resolveDefaultCdnBaseUrlFromActiveVersion = resolveDefaultCdnBaseUrlFromActiveVersion;

// Default URL segment under which the modern (v2) client is served.
// Kept local here so the CLI bootstrap (bin/index.js -> initEnv) stays lightweight
// and does not have to require heavier packages. A second copy of the fixed
// build-output directory name lives in:
//   - packages/core/app/client-v2/rsbuild.config.ts (output.distPath)
//   - packages/core/server/src/gateway/index.ts (MODERN_CLIENT_DIST_DIR)
// Keep them in sync. See docs/adr/0001-modern-client-prefix.md.
const DEFAULT_MODERN_CLIENT_PREFIX = 'v';

exports.DEFAULT_MODERN_CLIENT_PREFIX = DEFAULT_MODERN_CLIENT_PREFIX;

const DEFAULT_APP_CLIENT_ENTRY_MODE = 'legacy-default';
const APP_CLIENT_ENTRY_MODES = new Set(['legacy-default', 'modern-default', 'modern-only']);

exports.DEFAULT_APP_CLIENT_ENTRY_MODE = DEFAULT_APP_CLIENT_ENTRY_MODE;

function isAppClientEntryMode(value) {
  return APP_CLIENT_ENTRY_MODES.has(String(value || '').trim());
}

exports.isAppClientEntryMode = isAppClientEntryMode;

function normalizeAppClientEntryMode(value) {
  const normalized = String(value || '').trim();
  return isAppClientEntryMode(normalized) ? normalized : DEFAULT_APP_CLIENT_ENTRY_MODE;
}

exports.normalizeAppClientEntryMode = normalizeAppClientEntryMode;

function resolveAppClientEntryMode() {
  return normalizeAppClientEntryMode(process.env.APP_CLIENT_ENTRY_MODE);
}

exports.resolveAppClientEntryMode = resolveAppClientEntryMode;

// Normalize APP_MODERN_CLIENT_PREFIX (accepts `v`, `/v`, `/v/`)
// down to a bare segment like `v`.
function normalizeModernClientPrefix(value) {
  const segment = String(value || '')
    .trim()
    .replace(/^\/+|\/+$/g, '');
  return segment || DEFAULT_MODERN_CLIENT_PREFIX;
}

exports.normalizeModernClientPrefix = normalizeModernClientPrefix;

function resolveV2PublicPath(appPublicPath = '/') {
  const publicPath = resolvePublicPath(appPublicPath);
  const prefix = normalizeModernClientPrefix(process.env.APP_MODERN_CLIENT_PREFIX);
  return `${publicPath.replace(/\/$/, '')}/${prefix}/`;
}

exports.resolveV2PublicPath = resolveV2PublicPath;

function isAppDevHtml() {
  return process.argv[2] === 'app-dev' || process.env.NOCOBASE_APP_DEV === 'true';
}

function shouldRefreshLegacyIndexTemplate(data = '') {
  return (
    !data.includes("window['__nocobase_modern_client_prefix__']") ||
    !data.includes("window['__nocobase_app_client_entry_mode__']")
  );
}

function buildIndexHtml(force = false) {
  if (process.env.NOCOBASE_EXTRACT_CLIENT_ASSETS === 'true') {
    return;
  }
  const file = `${process.env.APP_PACKAGE_ROOT}/dist/client/index.html`;
  if (!fs.existsSync(file)) {
    return;
  }
  const tpl = `${process.env.APP_PACKAGE_ROOT}/dist/client/index.html.tpl`;
  if (force && fs.existsSync(tpl)) {
    fs.rmSync(tpl);
  }
  if (!fs.existsSync(tpl)) {
    fs.copyFileSync(file, tpl);
  } else if (shouldRefreshLegacyIndexTemplate(fs.readFileSync(tpl, 'utf-8'))) {
    fs.copyFileSync(file, tpl);
  }
  const data = fs.readFileSync(tpl, 'utf-8');
  let replacedData = data
    .replace(/\{\{env.CDN_BASE_URL\}\}/g, process.env.CDN_BASE_URL)
    .replace(/\{\{env.APP_PUBLIC_PATH\}\}/g, process.env.APP_PUBLIC_PATH)
    .replace(/\{\{env.APP_MODERN_CLIENT_PREFIX\}\}/g, normalizeModernClientPrefix(process.env.APP_MODERN_CLIENT_PREFIX))
    .replace(/\{\{env.APP_CLIENT_ENTRY_MODE\}\}/g, resolveAppClientEntryMode())
    .replace(/\{\{env.API_CLIENT_SHARE_TOKEN\}\}/g, process.env.API_CLIENT_SHARE_TOKEN || 'false')
    .replace(/\{\{env.API_CLIENT_STORAGE_TYPE\}\}/g, process.env.API_CLIENT_STORAGE_TYPE)
    .replace(/\{\{env.API_CLIENT_STORAGE_PREFIX\}\}/g, process.env.API_CLIENT_STORAGE_PREFIX)
    .replace(/\{\{env.API_BASE_URL\}\}/g, process.env.API_BASE_URL || process.env.API_BASE_PATH)
    .replace(/\{\{env.WS_URL\}\}/g, process.env.WEBSOCKET_URL || '')
    .replace(/\{\{env.WS_PATH\}\}/g, process.env.WS_PATH)
    .replace(/\{\{env.NOCOBASE_APP_DEV\}\}/g, isAppDevHtml() ? 'true' : 'false')
    .replace(/\{\{env.ESM_CDN_BASE_URL\}\}/g, process.env.ESM_CDN_BASE_URL || '')
    .replace(/\{\{env.ESM_CDN_SUFFIX\}\}/g, process.env.ESM_CDN_SUFFIX || '')
    .replace(/((?:src|href)=")(?:\.\/)?assets\//g, `$1${process.env.APP_PUBLIC_PATH}assets/`)
    .replace(/((?:src|href)=")\/assets\//g, `$1${process.env.APP_PUBLIC_PATH}assets/`)
    .replace('src="/umi.', `src="${process.env.APP_PUBLIC_PATH}umi.`)
    .replace(/((?:src|href)="[^"]*?)\/{2,}(assets\/)/g, '$1/$2');

  if (process.env.CDN_BASE_URL) {
    const appBaseUrl = process.env.CDN_BASE_URL.replace(/\/+$/, '');
    const appPublicPath = process.env.APP_PUBLIC_PATH.replace(/\/+$/, '');
    const re1 = new RegExp(`src="${appPublicPath}/`, 'g');
    const re2 = new RegExp(`href="${appPublicPath}/`, 'g');
    replacedData = replacedData.replace(re1, `src="${appBaseUrl}/`).replace(re2, `href="${appBaseUrl}/`);
  }
  fs.writeFileSync(file, replacedData, 'utf-8');
}

exports.buildIndexHtml = buildIndexHtml;

function getTimezonesByOffset(offset) {
  if (!/^[+-]\d{1,2}:\d{2}$/.test(offset)) {
    return offset;
  }
  const offsetMinutes = moment.duration(offset).asMinutes();
  return moment.tz.names().find((timezone) => {
    return moment.tz(timezone).utcOffset() === offsetMinutes;
  });
}

function areTimeZonesEqual(timeZone1, timeZone2) {
  if (timeZone1 === timeZone2) {
    return true;
  }
  timeZone1 = getTimezonesByOffset(timeZone1);
  timeZone2 = getTimezonesByOffset(timeZone2);
  return moment.tz(timeZone1).format('Z') === moment.tz(timeZone2).format('Z');
}

/**
 * Absolute application storage root (same rules as `@nocobase/utils` `resolveStorageRoot`).
 * Resolves STORAGE_PATH for initEnv; after initEnv, `process.env.STORAGE_PATH` is set to this absolute path.
 */
function resolveStorageRoot() {
  if (process.env.STORAGE_PATH) {
    if (isAbsolute(process.env.STORAGE_PATH)) {
      return process.env.STORAGE_PATH;
    }
    return resolve(process.cwd(), process.env.STORAGE_PATH);
  }
  return resolve(process.cwd(), 'storage');
}

/** Join segments under the storage root (same semantics as `@nocobase/utils` `storagePathJoin`). */
function storagePathJoin(...segments) {
  return join(resolveStorageRoot(), ...segments);
}

exports.resolveStorageRoot = resolveStorageRoot;
exports.storagePathJoin = storagePathJoin;
exports.resolvePluginStoragePath = resolvePluginStoragePath;
/** @deprecated Use resolveStorageRoot — kept for backward compatibility */
exports.generateStoragePath = resolveStorageRoot;

function generateGatewayPath() {
  if (process.env.SOCKET_PATH) {
    if (isAbsolute(process.env.SOCKET_PATH)) {
      return process.env.SOCKET_PATH;
    }
    return resolve(process.cwd(), process.env.SOCKET_PATH);
  }
  if (process.env.NOCOBASE_RUNNING_IN_DOCKER === 'true') {
    return resolve(os.homedir(), '.nocobase', 'gateway.sock');
  }
  return storagePathJoin('gateway.sock');
}

function generatePm2Home() {
  if (process.env.PM2_HOME) {
    if (isAbsolute(process.env.PM2_HOME)) {
      return process.env.PM2_HOME;
    }
    return resolve(process.cwd(), process.env.PM2_HOME);
  }
  if (process.env.NOCOBASE_RUNNING_IN_DOCKER === 'true') {
    return resolve(os.homedir(), '.nocobase', 'pm2');
  }
  return storagePathJoin('.pm2');
}

exports.initEnv = function initEnv() {
  const preserveSymlinksFlag = '--preserve-symlinks';
  const currentNodeOptions = String(process.env.NODE_OPTIONS || '').trim();
  const hasPreserveSymlinksFlag = currentNodeOptions
    ? currentNodeOptions.split(/\s+/).includes(preserveSymlinksFlag)
    : false;
  if (!hasPreserveSymlinksFlag) {
    process.env.NODE_OPTIONS = currentNodeOptions
      ? `${currentNodeOptions} ${preserveSymlinksFlag}`
      : preserveSymlinksFlag;
  }

  const env = {
    APP_ENV: 'development',
    APP_KEY: 'test-jwt-secret',
    APP_PORT: 13000,
    API_BASE_PATH: '/api/',
    API_CLIENT_STORAGE_PREFIX: 'NOCOBASE_',
    API_CLIENT_SHARE_TOKEN: 'false',
    API_CLIENT_STORAGE_TYPE: 'localStorage',
    // DB_DIALECT: 'sqlite',
    // DB_STORAGE, LOCAL_STORAGE_DEST, PLUGIN_STORAGE_PATH, etc. are set after dotenv from STORAGE_PATH
    // DB_TIMEZONE: '+00:00',
    DB_UNDERSCORED: parseEnv('DB_UNDERSCORED'),
    DEFAULT_STORAGE_TYPE: 'local',
    MFSU_AD: 'none',
    MAKO_AD: 'none',
    WS_PATH: '/ws',
    // PM2_HOME: generatePm2Home(),
    // SOCKET_PATH: generateGatewayPath(),
    NODE_MODULES_PATH: resolve(process.cwd(), 'node_modules'),
    NODE_PATH: resolve(process.cwd(), 'node_modules'),
    PLUGIN_PACKAGE_PREFIX: '@nocobase/plugin-,@nocobase/plugin-sample-,@nocobase/preset-',
    SERVER_TSCONFIG_PATH: './tsconfig.server.json',
    CACHE_DEFAULT_STORE: 'memory',
    CACHE_MEMORY_MAX: 2000,
    BROWSERSLIST_IGNORE_OLD_DATA: true,
    NOCOBASE_DEV_LOCAL_PLUGINS_ONLY: 'true',
    PLUGIN_STATICS_PATH: '/static/plugins/',
    APP_SERVER_BASE_URL: '',
    APP_BASE_URL: '',
    CDN_BASE_URL: '',
    APP_PUBLIC_PATH: '/',
    APP_MODERN_CLIENT_PREFIX: DEFAULT_MODERN_CLIENT_PREFIX,
    APP_CLIENT_ENTRY_MODE: DEFAULT_APP_CLIENT_ENTRY_MODE,
    ESM_CDN_BASE_URL: 'https://esm.sh',
    ESM_CDN_SUFFIX: '',
  };

  if (
    !process.env.APP_ENV_PATH &&
    process.argv[2] &&
    ['test', 'test:client', 'test:server', 'benchmark', 'perf'].includes(process.argv[2])
  ) {
    if (fs.existsSync(resolve(process.cwd(), '.env.test'))) {
      process.env.APP_ENV_PATH = '.env.test';
    }
  }

  if (!process.env.APP_ENV_PATH && process.argv[2] === 'e2e') {
    // 用于存放 playwright 自动生成的相关的文件
    generatePlaywrightPath();
    if (!fs.existsSync('.env.e2e') && fs.existsSync('.env.e2e.example')) {
      const env = fs.readFileSync('.env.e2e.example');
      fs.writeFileSync('.env.e2e', env);
    }
    if (!fs.existsSync('.env.e2e')) {
      throw new Error('Please create .env.e2e file first!');
    }
    process.env.APP_ENV_PATH = '.env.e2e';
  }

  dotenv.config({
    path: resolve(process.cwd(), process.env.APP_ENV_PATH || '.env'),
  });

  const storagePath = resolveStorageRoot();
  process.env.STORAGE_PATH = storagePath; // absolute; other modules may use process.env.STORAGE_PATH after this
  Object.assign(env, {
    DB_STORAGE: storagePathJoin('db', 'nocobase.sqlite'),
    LOCAL_STORAGE_DEST: storagePathJoin('uploads'),
    PLUGIN_STORAGE_PATH: storagePathJoin('plugins'),
    PLAYWRIGHT_AUTH_FILE: storagePathJoin('playwright', '.auth', 'admin.json'),
    WATCH_FILE: storagePathJoin('app.watch.ts'),
  });

  if (process.argv[2] === 'e2e' && !process.env.APP_BASE_URL) {
    process.env.APP_BASE_URL = `http://127.0.0.1:${process.env.APP_PORT}`;
  }

  for (const key in env) {
    if (!process.env[key]) {
      process.env[key] = env[key];
    }
  }

  const rawAppClientEntryMode = String(process.env.APP_CLIENT_ENTRY_MODE || '').trim();
  if (rawAppClientEntryMode && !isAppClientEntryMode(rawAppClientEntryMode)) {
    console.warn(
      `Unknown APP_CLIENT_ENTRY_MODE "${rawAppClientEntryMode}", falling back to ${DEFAULT_APP_CLIENT_ENTRY_MODE}.`,
    );
  }
  process.env.APP_CLIENT_ENTRY_MODE = normalizeAppClientEntryMode(rawAppClientEntryMode);

  if (!process.env.__env_modified__ && process.env.APP_PUBLIC_PATH) {
    const publicPath = process.env.APP_PUBLIC_PATH.replace(/\/$/g, '');
    const keys = ['API_BASE_PATH', 'WS_PATH', 'PLUGIN_STATICS_PATH'];
    for (const key of keys) {
      process.env[key] = publicPath + process.env[key];
    }
    process.env.__env_modified__ = true;
  }

  if (!process.env.__env_modified__ && process.env.APP_SERVER_BASE_URL && !process.env.API_BASE_URL) {
    process.env.API_BASE_URL = process.env.APP_SERVER_BASE_URL + process.env.API_BASE_PATH;
    process.env.__env_modified__ = true;
  }

  if (!process.env.CDN_BASE_URL) {
    process.env.CDN_BASE_URL =
      resolveDefaultCdnBaseUrlFromActiveVersion(process.env.APP_PUBLIC_PATH) ||
      (process.env.APP_PUBLIC_PATH !== '/' ? process.env.APP_PUBLIC_PATH : '');
  }

  if (process.env.CDN_BASE_URL.includes('http') && process.env.CDN_VERSION === 'auto') {
    const version = require('../package.json').version;
    process.env.CDN_BASE_URL = process.env.CDN_BASE_URL.replace(/\/+$/, '') + '/' + version + '/';
    process.env.CDN_VERSION = '';
  }

  if (!process.env.TZ) {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    process.env.TZ = getTimezonesByOffset(process.env.DB_TIMEZONE || timeZone);
  }

  if (!process.env.DB_TIMEZONE) {
    process.env.DB_TIMEZONE = process.env.TZ;
  }

  if (!/^[+-]\d{1,2}:\d{2}$/.test(process.env.DB_TIMEZONE)) {
    process.env.DB_TIMEZONE = moment.tz(process.env.DB_TIMEZONE).format('Z');
  }

  if (!areTimeZonesEqual(process.env.DB_TIMEZONE, process.env.TZ)) {
    throw new Error(
      `process.env.DB_TIMEZONE="${process.env.DB_TIMEZONE}" and process.env.TZ="${process.env.TZ}" are different`,
    );
  }

  process.env.PM2_HOME = generatePm2Home();
  process.env.SOCKET_PATH = generateGatewayPath();
  fs.mkdirpSync(dirname(process.env.SOCKET_PATH), { force: true, recursive: true });
  fs.mkdirpSync(process.env.PM2_HOME, { force: true, recursive: true });
  const pkgs = [
    '@nocobase/plugin-multi-app-manager',
    '@nocobase/plugin-departments',
    '@nocobase/plugin-field-attachment-url',
    '@nocobase/plugin-workflow-response-message',
  ];
  for (const pkg of pkgs) {
    const pkgDir = join(resolvePluginStoragePath(), pkg);
    fs.existsSync(pkgDir) && fs.rmdirSync(pkgDir, { recursive: true, force: true });
  }
};

exports.checkDBDialect = function () {
  if (!process.env.DB_DIALECT) {
    throw new Error('DB_DIALECT is required.');
  }
};

exports.generatePlugins = function () {
  try {
    require.resolve('@nocobase/devtools/common');
    const { generateAllPlugins, generatePlugins, generateV2Plugins } = require('@nocobase/devtools/common');
    if (typeof generateAllPlugins === 'function') {
      generateAllPlugins();
      return;
    }
    generatePlugins?.();
    generateV2Plugins?.();
  } catch (error) {
    return;
  }
};

exports.isURL = function isURL(str) {
  let url;

  try {
    url = new URL(str);
  } catch (e) {
    return false;
  }

  return url.protocol === 'http:' || url.protocol === 'https:';
};

exports.buildWSURL = function buildWSURL(urlString, serverPort) {
  if (exports.isURL(urlString)) {
    const parsedUrl = new URL(urlString);
    parsedUrl.protocol = parsedUrl.protocol === 'https:' ? 'wss:' : 'ws:';
    parsedUrl.pathname =
      process.env.WS_PATH || (process.env.APP_PUBLIC_PATH ? process.env.APP_PUBLIC_PATH + 'ws' : '/ws');
    const url = parsedUrl.toString();
    return url;
  }

  return serverPort ? `ws://localhost:${serverPort}${process.env.WS_PATH}` : undefined;
};
