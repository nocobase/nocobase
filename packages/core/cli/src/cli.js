const { Command } = require('commander');
const commands = require('./commands');

const cli = new Command();

commands(cli);

module.exports = cli;
