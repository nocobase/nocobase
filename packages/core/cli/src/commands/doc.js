const { Command } = require('commander');
const { resolve, isAbsolute } = require('path');
const { run, isDev } = require('../util');
const fs = require('fs-extra');
const glob = require('fast-glob');

/**
 *
 * @param {Command} cli
 */
module.exports = (cli) => {
  cli
    .command('doc')
    .argument('[dev|build|serve]')
    .argument('[packages]')
    .option('--lang [lang]')
    .allowUnknownOption()
    .action((command, pkg, options) => {
      if (!isDev()) {
        return;
      }

      // 指定项目目录
      let cwd = process.cwd();
      if (command === undefined && pkg === undefined) {
        command = 'dev';
      } else if (!['dev', 'build', 'serve'].includes(command) && pkg === undefined) {
        pkg = command;
        command = 'dev';
        cwd = resolve(process.cwd(), 'packages', pkg);
      }
      if (pkg !== undefined) {
        process.env.APP_ROOT = `packages/${pkg}`;
      }

      // 删除 tmp 目录
      const tmpDir = glob.sync(
        ['.dumi/tmp', '.dumi/tmp-production', 'packages/*/*/.dumi/tmp', 'packages/*/*.dumi/tmp-production'],
        {
          cwd: process.cwd(),
          onlyDirectories: true,
        },
      );
      tmpDir.forEach((dir) => {
        fs.removeSync(dir);
      });

      // 设置语言
      process.env.DOC_LANG = options.lang || 'en-US';

      if (command === 'serve') {
        // 如果是多语言，则需要进入内部，如果不是多语言，则直接进入 docs/dist
        let dir = resolve(cwd, 'docs/dist', process.env.DOC_LANG);
        if (!fs.existsSync(dir)) {
          dir = resolve(cwd, 'docs/dist');
        }
        run('serve', [dir]);
      } else {
        run('dumi', [command], {
          env: {
            APP_ROOT: process.env.APP_ROOT || './packages/core/client',
            DOC_LANG: process.env.DOC_LANG,
          },
        });
      }
    });
};
