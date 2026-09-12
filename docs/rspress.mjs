import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { loadConfig } from '@rsbuild/core';
import { dev as rspressDev } from '@rspress/core';
import chokidar from 'chokidar';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const rawArgs = hideBin(process.argv);
const argv = yargs(rawArgs).parse();
const command = typeof argv._[0] === 'string' ? argv._[0] : '';
const docsLang =
  argv.lang === 'all'
    ? undefined
    : String(argv.lang || process.env.DOCS_LANG || 'en');
const DEFAULT_CONFIG_BASENAME = 'rspress.config';
const DEFAULT_CONFIG_EXTENSIONS = [
  '.ts',
  '.mts',
  '.js',
  '.mjs',
  '.cts',
  '.cjs',
];
const META_FILES = new Set(['_meta.json', '_nav.json']);

const forwardedArgs = rawArgs.filter((arg, index, arr) => {
  if (
    arg === '--lang' ||
    arg === '--check-dead-links' ||
    arg === '--no-check-dead-links'
  ) {
    return false;
  }

  if (arg.startsWith('--lang=') || arg.startsWith('--check-dead-links=')) {
    return false;
  }

  if (
    index > 0 &&
    (arr[index - 1] === '--lang' || arr[index - 1] === '--check-dead-links')
  ) {
    return false;
  }

  return true;
});

if (docsLang) {
  process.env.DOCS_LANG = docsLang;
}

if (typeof argv['check-dead-links'] === 'boolean') {
  process.env.CHECK_DEAD_LINKS = String(argv['check-dead-links']);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);
const rspressPackageJsonPath = require.resolve('@rspress/core/package.json');
const rspressPackageJson = require('@rspress/core/package.json');
const rspressBinPath = path.join(
  path.dirname(rspressPackageJsonPath),
  rspressPackageJson.bin.rspress,
);

function createChild(envOverrides = {}) {
  return spawn(process.execPath, [rspressBinPath, ...forwardedArgs], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      ...envOverrides,
    },
    stdio: 'inherit',
  });
}

function resolveConfigFile(customConfigFile) {
  const cwd = process.cwd();

  if (typeof customConfigFile === 'string' && customConfigFile) {
    return path.isAbsolute(customConfigFile)
      ? customConfigFile
      : path.join(cwd, customConfigFile);
  }

  for (const extension of DEFAULT_CONFIG_EXTENSIONS) {
    const candidate = path.join(cwd, `${DEFAULT_CONFIG_BASENAME}${extension}`);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return '';
}

async function loadRspressConfig(customConfigFile) {
  const configFilePath = resolveConfigFile(customConfigFile);

  if (!configFilePath) {
    return {
      config: {},
      configFilePath: '',
    };
  }

  const { content } = await loadConfig({
    cwd: path.dirname(configFilePath),
    path: configFilePath,
  });

  return {
    config: content,
    configFilePath,
  };
}

function resolveDocRoot(cwd, cliRoot, configRoot) {
  if (cliRoot) {
    return path.join(cwd, cliRoot);
  }

  if (configRoot) {
    return path.isAbsolute(configRoot)
      ? configRoot
      : path.join(cwd, configRoot);
  }

  return path.join(cwd, 'docs');
}

async function buildAllLanguages() {
  const docsPath = path.join(__dirname, 'docs');

  if (!fs.existsSync(docsPath)) {
    console.error('docs directory does not exist');
    process.exitCode = 1;
    return;
  }

  let dirs = fs
    .readdirSync(docsPath, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  dirs = dirs.filter((dir) => dir !== 'en');
  dirs.unshift('en');

  console.log(`Found language directories: ${dirs.join(', ')}`);

  for (const dir of dirs) {
    console.log(`\nBuilding --lang=${dir}...`);

    const exitCode = await new Promise((resolve) => {
      const child = createChild({ DOCS_LANG: dir });
      child.once('exit', (code) => resolve(code ?? 0));
    });

    if (exitCode !== 0) {
      console.error(`Build failed for --lang=${dir}, exit code: ${exitCode}`);
      process.exit(exitCode);
    }

    console.log(`Built --lang=${dir}`);
  }

  console.log('\nAll language builds completed.');
}

async function runDevWithMetaWatcher() {
  const cwd = process.cwd();
  const cliRoot =
    command === 'dev' && typeof argv._[1] === 'string' ? String(argv._[1]) : '';
  let restarting = false;
  let shuttingDown = false;
  let watcher;
  let devServer;

  const startDevServer = async () => {
    const { config, configFilePath } = await loadRspressConfig(argv.config);
    config.root = resolveDocRoot(cwd, cliRoot, config.root);
    const docDirectory = config.root;

    devServer = await rspressDev({
      appDirectory: cwd,
      docDirectory,
      config,
      configFilePath,
      extraBuilderConfig: {
        server: {
          port: argv.port,
          host: argv.host,
        },
      },
    });

    const watchTargets = configFilePath
      ? [configFilePath, docDirectory]
      : [docDirectory];

    watcher = chokidar.watch(watchTargets, {
      ignoreInitial: true,
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/.DS_Store/**',
        path.join(docDirectory, 'public'),
      ],
    });

    watcher.on('all', async (eventName, filepath) => {
      const basename = path.basename(filepath);
      const shouldRestart =
        eventName === 'add' ||
        eventName === 'unlink' ||
        (eventName === 'change' &&
          ((configFilePath && filepath === configFilePath) ||
            META_FILES.has(basename)));

      if (!shouldRestart || restarting || shuttingDown) {
        return;
      }

      restarting = true;
      console.log(
        `\n✨ ${eventName} ${path.relative(
          cwd,
          filepath,
        )}, dev server will restart...\n`,
      );
      await devServer.close();
      await watcher.close();
      await startDevServer();
      restarting = false;
    });
  };

  await startDevServer();

  const shutdown = async () => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    await watcher?.close();
    await devServer?.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

if (argv.lang === 'all') {
  buildAllLanguages().catch((error) => {
    console.error(error);
    process.exit(1);
  });
} else if (command === 'dev' || command === '') {
  runDevWithMetaWatcher().catch((error) => {
    console.error(error);
    process.exit(1);
  });
} else {
  const child = createChild();
  child.once('exit', (code) => {
    process.exit(code ?? 0);
  });
}
