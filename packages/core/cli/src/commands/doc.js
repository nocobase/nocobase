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
    .option('--lang [lang]')
    .allowUnknownOption()
    .action((options) => {
      if (!isDev()) {
        return;
      }
      process.env.DOC_LANG = options.lang || 'en-US';
      const docThemePath = process.env.DOC_THEME_PATH;
      if (!docThemePath) {
        process.env.DUMI_THEME = resolve(process.cwd(), 'packages/core/dumi-theme-nocobase/src');
      } else {
        process.env.DUMI_THEME = isAbsolute(docThemePath) ? docThemePath : resolve(process.cwd(), docThemePath);
      }
      // TODO(bug): space replace = not work
      const index = process.argv.indexOf(`--lang=${options.lang}`);
      if (index > 0) {
        process.argv.splice(index, 1);
      }
      const argv = process.argv.slice(3);
      const argument = argv.shift() || 'dev';
      if (argument === 'serve') {
        run('serve', [`${resolve(process.cwd(), 'docs/dist', process.env.DOC_LANG)}`, ...argv]);
      } else {
        run('dumi', [argument, ...argv]);
      }
    });
};
