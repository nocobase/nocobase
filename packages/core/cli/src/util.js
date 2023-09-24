const net = require('net');
const chalk = require('chalk');
const execa = require('execa');
const fg = require('fast-glob');
const { dirname, join, resolve } = require('path');
const { readFile, writeFile } = require('fs').promises;
const { existsSync, mkdirSync, cpSync, writeFileSync } = require('fs');

exports.isPackageValid = (package) => {
  try {
    require.resolve(package);
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

exports.run = (command, argv, options = {}) => {
  return execa(command, argv, {
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
    console.error(chalk.red(`post already in use ${port}`));
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
};

exports.genTsConfigPaths = function genTsConfigPaths() {
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
    const relativePath = packageDir.slice(cwdLength + 1).replace(/\\/, '/');
    paths[packageJsonName] = [`${relativePath}/src`];
    paths[`${packageJsonName}/client`] = [`${relativePath}/src/client`];
  });

  const tsConfigJsonPath = join(cwd, './tsconfig.paths.json');
  const content = { compilerOptions: { paths } };
  writeFileSync(tsConfigJsonPath, JSON.stringify(content, null, 2), 'utf-8');
  return content;
};
