#! /usr/bin/env ts-node-script

import path from 'path';
import { Application } from '@nocobase/server';
import { readConfig } from '@nocobase/server';

const { Command } = require('commander');

const loadApplication = async () => {
  const configurationDir = path.join(process.cwd(), 'packages/server/src/config');
  const config = await readConfig(configurationDir);
  const app = new Application(config);
  await app.load();
  return app;
};

(async () => {
  const program = new Command();
  const application = await loadApplication();

  const runSubCommand =
    (name) =>
    (...args) => {
      const command = require(`../commands/${name}`).default;

      Promise.resolve()
        .then(() => {
          return command({ app: application, args });
        })
        .catch((error) => {
          console.error(error);
          process.exit(1);
        });
    };

  program.command('hello').action(runSubCommand('hello'));
  program.command('console').action(runSubCommand('console'));
  program
    .command('develop')
    .alias('dev')
    .description('Start your NocoBase application with auto reload')
    .action(runSubCommand('dev'));

  if (application) {
    const appCommand = program.command('app').description('Application Command');
    application.cli.commands.forEach((cmd) => appCommand.addCommand(cmd));
  }

  await program.parseAsync(process.argv);
})();
