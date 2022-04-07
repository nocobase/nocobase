#! /usr/bin/env ts-node-script

import path from 'path';
import { Application, PluginManager } from '@nocobase/server';
import { readConfig } from '@nocobase/server';

const { Command } = require('commander');

const loadApplication = async () => {
  PluginManager.resolvePlugin = (name) => {
    let pluginClass;
    try {
      pluginClass = require(path.join(`${process.cwd()}`, `packages/${name}/server`));
    } catch (e) {
      pluginClass = require(name);
    }
    return pluginClass.default;
  };

  try {
    const configurationDir = path.join(process.cwd(), 'packages/server/src/config');
    const config = await readConfig(configurationDir);
    const app = new Application(config);
    await app.load();
    return app;
  } catch (e) {
    console.log({ e });
    return null;
  }
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

  program
    .command('develop')
    .alias('dev')
    .description('Start your NocoBase application with auto reload')
    .action(runSubCommand('dev'));

  program.command('create-plugin').description('create new plugin');

  if (application) {
    const appCommand = program.command('app').description('Application Command');
    application.cli.commands.forEach((cmd) => appCommand.addCommand(cmd));

    program.command('console').action(runSubCommand('console'));
  }

  await program.parseAsync(process.argv);
})();
