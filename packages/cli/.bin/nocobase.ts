#! /usr/bin/env ts-node-script

import path from 'path';
import { Application } from '@nocobase/server';
import { readConfig } from '@nocobase/server';

const { Command } = require('commander');
const runSubCommand =
  (name) =>
  (...args) => {
    const script = require(`../commands/${name}`).default;
    Promise.resolve()
      .then(() => {
        return script(...args);
      })
      .catch((error) => {
        console.error(error);
        process.exit(1);
      });
  };

const loadApplication = async () => {
  const configurationDir = path.join(process.cwd(), 'packages/server/src/config');
  const config = await readConfig(configurationDir);
  return new Application(config);
};

(async () => {
  const program = new Command();
  const application = await loadApplication();

  program.command('hello').action(runSubCommand('hello'));
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
