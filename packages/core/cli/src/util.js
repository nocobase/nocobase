const net = require('net');
const chalk = require('chalk');
const execa = require('execa');
const { resolve } = require('path');
const { readFile, writeFile } = require('fs').promises;
const { existsSync } = require('fs');

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

exports.nodeCheck = () => {
  if (!exports.hasTsNode()) {
    console.log('Please install all dependencies');
    console.log(chalk.yellow('$ yarn install'));
    process.exit(0);
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
  const { APP_PACKAGE_ROOT } = process.env;

  if (exports.isDev()) {
    const argv = [
      '-P',
      './tsconfig.server.json',
      '-r',
      'tsconfig-paths/register',
      `./packages/${APP_PACKAGE_ROOT}/server/src/index.ts`,
      'install',
      '-s',
    ];
    await exports.run('ts-node', argv);
  } else {
    const argv = [`./packages/${APP_PACKAGE_ROOT}/server/lib/index.js`, 'install', '-s'];
    await exports.run('node', argv);
  }
};

exports.runAppCommand = async (command, args = []) => {
  const { APP_PACKAGE_ROOT } = process.env;

  if (exports.isDev()) {
    const argv = [
      '-P',
      './tsconfig.server.json',
      '-r',
      'tsconfig-paths/register',
      `./packages/${APP_PACKAGE_ROOT}/server/src/index.ts`,
      command,
      ...args,
    ];
    await exports.run('ts-node', argv);
  } else {
    const argv = [`./packages/${APP_PACKAGE_ROOT}/server/lib/index.js`, command, ...args];
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
