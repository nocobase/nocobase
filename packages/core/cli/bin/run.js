#!/usr/bin/env node

(async () => {
  const { execute } = await import('@oclif/core');
  const fs = require('node:fs');
  const path = require('node:path');
  const pjson = require('../package.json');
  const root = path.resolve(__dirname, '..');
  const realRoot = fs.realpathSync(root);
  const normalizedRealRoot = realRoot.split(path.sep).join('/');
  const isSourcePackage = normalizedRealRoot.endsWith('/packages/core/cli');
  const development = isSourcePackage;
  const commandsDir = development ? './src/commands' : './lib/commands';

  await execute({
    development,
    loadOptions: {
      root,
      pjson: {
        ...pjson,
        oclif: {
          ...pjson.oclif,
          commands: commandsDir,
        },
      },
    },
  });
})();
