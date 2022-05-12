const { Command } = require('commander');
const { resolve, isAbsolute } = require('path');
const { run, isDev } = require('../util');

/**
 *
 * @param {Command} cli
 */
module.exports = (cli) => {
  cli
    .command('doc')
    .allowUnknownOption()
    .action(() => {
      if (!isDev()) {
        return;
      }
      const docThemePath = process.env.DOC_THEME_PATH;
      if (!docThemePath) {
        process.env.DUMI_THEME = resolve(process.cwd(), 'packages/core/dumi-theme-nocobase/src');
      } else {
        process.env.DUMI_THEME = isAbsolute(docThemePath) ? docThemePath : resolve(process.cwd(), docThemePath);
      }
      const argv = process.argv.slice(3);
      const argument = argv.shift() || 'dev';
      run('dumi', [argument, ...argv]);
    });
};
