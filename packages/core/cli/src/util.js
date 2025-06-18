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
  console.log(chalk.green('WAIT: ') + 'TypeScript compiling...');
};

exports.downloadPro = async () => {
  const { NOCOBASE_PKG_USERNAME, NOCOBASE_PKG_PASSWORD } = process.env;
  if (!(NOCOBASE_PKG_USERNAME && NOCOBASE_PKG_PASSWORD)) {
    return;
  }
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

exports.generateAppDir = function generateAppDir() {
  const appPkgPath = dirname(dirname(require.resolve('@nocobase/app/src/index.ts')));
  const appDevDir = resolve(process.cwd(), './storage/.app-dev');
  if (exports.isDev() && !exports.hasCorePackages() && appPkgPath.includes('node_modules')) {
    if (!existsSync(appDevDir)) {
      mkdirSync(appDevDir, { force: true, recursive: true });
      cpSync(appPkgPath, appDevDir, {
        recursive: true,
        force: true,
      });
    }
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
  });

  const tsConfigJsonPath = join(cwd, './tsconfig.paths.json');
  const content = { compilerOptions: { paths } };
  writeFileSync(tsConfigJsonPath, JSON.stringify(content, null, 2), 'utf-8');
  return content;
};

function generatePlaywrightPath(clean = false) {
  try {
    const playwright = resolve(process.cwd(), 'storage/playwright/tests');
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

function buildIndexHtml(force = false) {
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
  }
  const data = fs.readFileSync(tpl, 'utf-8');
  const replacedData = data
    .replace(/\{\{env.APP_PUBLIC_PATH\}\}/g, process.env.APP_PUBLIC_PATH)
    .replace(/\{\{env.API_CLIENT_STORAGE_TYPE\}\}/g, process.env.API_CLIENT_STORAGE_TYPE)
    .replace(/\{\{env.API_CLIENT_STORAGE_PREFIX\}\}/g, process.env.API_CLIENT_STORAGE_PREFIX)
    .replace(/\{\{env.API_BASE_URL\}\}/g, process.env.API_BASE_URL || process.env.API_BASE_PATH)
    .replace(/\{\{env.WS_URL\}\}/g, process.env.WEBSOCKET_URL || '')
    .replace(/\{\{env.WS_PATH\}\}/g, process.env.WS_PATH)
    .replace('src="/umi.', `src="${process.env.APP_PUBLIC_PATH}umi.`);
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
  return resolve(process.cwd(), 'storage/gateway.sock');
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
  return resolve(process.cwd(), './storage/.pm2');
}

exports.initEnv = function initEnv() {
  const env = {
    APP_ENV: 'development',
    APP_KEY: 'test-jwt-secret',
    APP_PORT: 13000,
    API_BASE_PATH: '/api/',
    API_CLIENT_STORAGE_PREFIX: 'NOCOBASE_',
    API_CLIENT_STORAGE_TYPE: 'localStorage',
    // DB_DIALECT: 'sqlite',
    DB_STORAGE: 'storage/db/nocobase.sqlite',
    // DB_TIMEZONE: '+00:00',
    DB_UNDERSCORED: parseEnv('DB_UNDERSCORED'),
    DEFAULT_STORAGE_TYPE: 'local',
    LOCAL_STORAGE_DEST: 'storage/uploads',
    PLUGIN_STORAGE_PATH: resolve(process.cwd(), 'storage/plugins'),
    MFSU_AD: 'none',
    MAKO_AD: 'none',
    WS_PATH: '/ws',
    // PM2_HOME: generatePm2Home(),
    // SOCKET_PATH: generateGatewayPath(),
    NODE_MODULES_PATH: resolve(process.cwd(), 'node_modules'),
    PLUGIN_PACKAGE_PREFIX: '@nocobase/plugin-,@nocobase/plugin-sample-,@nocobase/preset-',
    SERVER_TSCONFIG_PATH: './tsconfig.server.json',
    PLAYWRIGHT_AUTH_FILE: resolve(process.cwd(), 'storage/playwright/.auth/admin.json'),
    CACHE_DEFAULT_STORE: 'memory',
    CACHE_MEMORY_MAX: 2000,
    BROWSERSLIST_IGNORE_OLD_DATA: true,
    PLUGIN_STATICS_PATH: '/static/plugins/',
    LOGGER_BASE_PATH: 'storage/logs',
    APP_SERVER_BASE_URL: '',
    APP_PUBLIC_PATH: '/',
    WATCH_FILE: resolve(process.cwd(), 'storage/app.watch.ts'),
  };

  if (
    !process.env.APP_ENV_PATH &&
    process.argv[2] &&
    ['test', 'test:client', 'test:server', 'benchmark'].includes(process.argv[2])
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

  if (process.argv[2] === 'e2e' && !process.env.APP_BASE_URL) {
    process.env.APP_BASE_URL = `http://127.0.0.1:${process.env.APP_PORT}`;
  }

  for (const key in env) {
    if (!process.env[key]) {
      process.env[key] = env[key];
    }
  }

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
    const pkgDir = resolve(process.cwd(), 'storage/plugins', pkg);
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
    require.resolve('@nocobase/devtools/umiConfig');
    const { generatePlugins } = require('@nocobase/devtools/umiConfig');
    generatePlugins();
  } catch (error) {
    return;
  }
};
