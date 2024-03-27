const { Command } = require('commander');
const { run } = require('../util');
const fg = require('fast-glob');
const fs = require('fs');

module.exports = (cli) => {
  return cli.command('test-coverage:server').action(async (paths, opts) => {
    const packageRoots = ['packages/core', 'packages/plugins/@nocobase'];
    for (const dir of packageRoots) {
      // read package in dir
      const entries = await fg.glob([`${dir}/*/package.json`], {});
      for (const entry of entries) {
        // read package.json content

        const packageJson = await fs.promises.readFile(entry, 'utf-8');
        const package = JSON.parse(packageJson);

        console.log(`run coverage for ${package.name}@${package.version}`);

        try {
          await run('yarn', ['test:server', '--coverage', `${entry.replace('/package.json', '')}`]);
        } catch (e) {
          continue;
        }
      }
    }
  });
};
