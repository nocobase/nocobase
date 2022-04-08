#! /usr/bin/env ts-node-script
require('dotenv').config();
import path from 'path';
import { Application, PluginManager } from '@nocobase/server';
import { readConfig } from '@nocobase/server';
import { setCommandOptions as setCreateAppCommandOptions, createApp } from 'create-nocobase-app/lib/create-app';

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

  setCreateAppCommandOptions(program.command('create-app')).action((directory, options) => {
    createApp(directory, options);
  });

  if (application) {
    const appCommand = program.command('app').description('Application Command');
    application.cli.commands.forEach((cmd) => appCommand.addCommand(cmd));

    program.command('console').action(runSubCommand('console'));
  }

  await program.parseAsync(process.argv);
})();
