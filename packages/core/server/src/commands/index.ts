import { Command } from 'commander';
import Application from '../application';

export function createCli(app: Application) {
  const program = new Command();

  const runSubCommand =
    (name) =>
    (...cliArgs) => {
      const command = require(`./${name}`).default;

      Promise.resolve()
        .then(() => {
          return command({ app, cliArgs });
        })
        .catch((error) => {
          console.error(error);
          process.exit(1);
        });
    };

  program.command('start').description('start NocoBase application').option('-s, --silent').action(runSubCommand('start'));
  program.command('install').option('-f, --force').option('-c, --clean').option('-s, --silent').action(runSubCommand('install'));
  program.command('db:sync').option('-f, --force').action(runSubCommand('db-sync'));
  program.command('db:auth').option('-r, --repeat [repeat]').action(runSubCommand('db-auth'));
  program.command('console').action(runSubCommand('console'));
  program.command('build').action(runSubCommand('build'));

  program
    .command('create-plugin')
    .argument('<name>', 'name of plugin')
    .description('create NocoBase plugin')
    .action(runSubCommand('create-plugin'));

  return program;
}
