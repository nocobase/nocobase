const { resolve } = require('path');
const { Command } = require('commander');
const { PluginGenerator } = require('../plugin-generator');

/**
 *
 * @param {Command} cli
 */
module.exports = (cli) => {
  cli
    .command('create-plugin')
    .argument('<name>')
    .allowUnknownOption()
    .action(async (name, options) => {
      const generator = new PluginGenerator({
        cwd: resolve(process.cwd(), name),
        args: options,
        context: {
          name,
        },
      });
      await generator.run();
    });
};
