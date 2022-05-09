const { Command } = require('commander');

/**
 *
 * @param {Command} cli
 */
module.exports = (cli) => {
  require('./global')(cli);
  require('./build')(cli);
  require('./dev')(cli);
  require('./start')(cli);
  require('./test')(cli);
  require('./umi')(cli);
}
