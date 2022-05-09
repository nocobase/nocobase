const { spawn } = require('child_process');
const { asyncSpawn } = require('./asyncSpawn');
const { resolve } = require('path');

const isDev = process.env.NOCOBASE_ENV !== 'production';
const argv = [...process.argv];
const nodeBin = argv.shift();
const file = argv.shift();

const dotenv = require('dotenv');

dotenv.config({
  path: resolve(process.cwd(), process.env.NOCOBASE_ENV_PATH || '.env'),
});

const { Command } = require('commander');
const program = new Command();

program
  .allowUnknownOption()
  .option('-h, --help')
  .action((option) => {
    if (isDev) {
      argv.unshift(
        ...[
          nodeBin,
          file,
          '-P',
          './tsconfig.server.json',
          '-r',
          'dotenv/config',
          '-r',
          'tsconfig-paths/register',
          './packages/app/server/src/index.ts',
        ],
      );
      process.argv = argv;
      require('ts-node-dev/lib/bin');
    } else {
      argv.unshift(...['-r dotenv/config', './packages/app/server/lib/index.js']);
      require('child_process').spawn(nodeBin, argv, { shell: true, stdio: 'inherit' });
    }
  });

program
  .command('dev')
  .allowUnknownOption()
  .action(() => {
    const serverArgv = [
      '-P',
      './tsconfig.server.json',
      '-r',
      'dotenv/config',
      '-r',
      'tsconfig-paths/register',
      './packages/app/server/src/index.ts',
      'start',
    ];
    const clientArgs = ['dev'];
    spawn('ts-node-dev', serverArgv, { shell: true, stdio: 'inherit' });
    spawn('umi', clientArgs, {
      env: {
        ...process.env,
        APP_ROOT: 'packages/app/client',
      },
      shell: true,
      stdio: 'inherit',
    });
  });

program
  .command('build')
  .allowUnknownOption()
  .option(
    '-p, --package [package]',
    '',
    (value, previous) => {
      previous.push(value);
      return previous;
    },
    [],
  )
  .action(async (opts) => {
    argv.shift();
    const pkgs = opts.package || [];
    if (!pkgs.length || !pkgs.includes('app/client') || (pkgs.includes('app/client') && pkgs.length > 1)) {
      await asyncSpawn('nocobase-build', argv, { shell: true, stdio: 'inherit' });
    }
    if (!pkgs.length || pkgs.includes('app/client')) {
      spawn('umi', ['build'], {
        env: {
          ...process.env,
          APP_ROOT: 'packages/app/client',
        },
        shell: true,
        stdio: 'inherit',
      });
    }
  });

program
  .command('test')
  .allowUnknownOption()
  .action(() => {
    argv.shift();
    argv.unshift('-i');
    process.argv = [nodeBin, file, ...argv];
    require('jest-cli/bin/jest');
  });

program
  .command('start')
  .option('--pm2')
  .allowUnknownOption()
  .action((opts) => {
    console.log(opts);
    if (isDev && !opts.pm2) {
      process.argv = [
        nodeBin,
        file,
        '-P',
        './tsconfig.server.json',
        '-r',
        'dotenv/config',
        '-r',
        'tsconfig-paths/register',
        './packages/app/server/src/index.ts',
        ...argv,
      ];
      require('ts-node-dev/lib/bin');
    } else {
      process.argv = [
        nodeBin,
        file,
        'start',
        '--node-args=-r dotenv/config',
        'packages/app/server/lib/index.js',
        '--',
        ...argv,
      ];
      require('pm2/lib/binaries/Runtime4Docker.js');
    }
  });

program.parse(process.argv);
