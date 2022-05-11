const { Command } = require('commander');
const commands = require('./commands');

const cli = new Command();

cli.version(require('../package.json').version);

commands(cli);

module.exports = cli;
