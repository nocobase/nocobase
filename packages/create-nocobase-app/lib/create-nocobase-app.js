const { createApp, setCommandOptions } = require('./create-app');

const { Command } = require('commander');
const packageJson = require('../package.json');
const program = new Command(packageJson.name);

setCommandOptions(program);

program.action((directory, options) => createApp(directory, options));

program.parse(process.argv);
