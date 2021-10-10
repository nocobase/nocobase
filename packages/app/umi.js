#!/usr/bin/env node

try {
  require.resolve('umi');

  require('v8-compile-cache');

  const resolveCwd = require('@umijs/deps/compiled/resolve-cwd');

  const { name, bin } = require('umi/package.json');
  const localCLI = resolveCwd.silent(`${name}/${bin['umi']}`);
  if (!process.env.USE_GLOBAL_UMI && localCLI && localCLI !== __filename) {
    const debug = require('@umijs/utils').createDebug('umi:cli');
    debug('Using local install of umi');
    require(localCLI);
  } else {
    require('umi/lib/cli');
  }
  
} catch (error) {
  console.log('done')
}
