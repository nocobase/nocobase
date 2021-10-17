import { chalk } from '@umijs/utils';
import commander from 'commander';
import path from 'path';
import ora from 'ora';
import { hasYarn, runInit, runInstall, runStart } from './utils';
import execa from 'execa';

const packageJson = require('../package.json');

const program = new commander.Command(packageJson.name)
  .version(packageJson.version)
  .option('--simple', 'create nocobase app without install dependencies')
  .option('--quickstart', 'create quickstart nocobase app')
  .arguments('<project-directory>')
  .usage(`${chalk.green('<project-directory>')}`)
  .action(async (directory, options) => {
    console.log(
      `Creating a new Nocobase application at ${chalk.green(directory)}.`,
    );
    console.log('Creating files.');

    const fullPath = path.join(process.cwd(), directory);

    await require('./index').default({
      cwd: fullPath,
      args: {},
      tplContext: options.quickstart
        ? { quickstart: true }
        : { quickstart: false },
    });

    const cmd = chalk.cyan(hasYarn() ? 'yarn' : 'npm run');

    if (options.simple) {
      console.log();
      console.log('Done. You can start by doing:');
      console.log();
      console.log(`  ${chalk.cyan('cd')} ${directory}`);
      console.log(`  ${cmd} install`);
      console.log(`  ${cmd} nocobase init`);
      console.log(`  ${cmd} start`);
      console.log();
      return;
    }

    const installPrefix = chalk.yellow('Installing dependencies:');
    const loader = ora(installPrefix).start();
    const logInstall = (chunk = '') => {
      loader.text = `${installPrefix} ${chunk
        .toString()
        .split('\n')
        .join(' ')}`;
    };

    const runner = runInstall(fullPath);

    runner?.stdout?.on('data', logInstall);
    runner?.stderr?.on('data', logInstall);

    await runner;
    loader.stop();
    console.log(`Dependencies installed ${chalk.green('successfully')}.`);
    console.log();
    console.log(`Your application was created at ${chalk.green(directory)}.\n`);

    if (options.quickstart) {
      // Using Sqlite as Database
      const prefix = chalk.yellow('Nocobase init');
      const initLoader = ora(prefix).start();

      try {
        const initLog = (chunk = '') => {
          initLoader.text = `${prefix} ${chunk
            .toString()
            .split('\n')
            .join(' ')}`;
        };

        const init = runInit(fullPath);
        init.stderr.on('data', initLog);
        init.stdout.on('data', initLog);
        await init;
        initLoader.stop();
      } catch (e) {
        initLoader.stop();
        console.log();
        console.log(e.message);
        process.exit(1);
      }

      console.log(`Running your application.`);
      await execa('npm', ['run', 'start'], {
        stdio: 'inherit',
        cwd: fullPath,
      });
    } else {
      console.log();
      console.log('You can start by doing:');
      console.log();
      console.log(`  ${chalk.cyan('cd')} ${directory}`);
      console.log(`  ${cmd} nocobase init`);
      console.log(`  ${cmd} start`);
      console.log();
    }
  })
  .showHelpAfterError()
  .parse(process.argv);
