import common from './common.js';
import path from 'node:path';

const { getPackagePaths, generateV2Plugins, generatePlugins } = common;

export function getRsbuildAlias() {
  return getPackagePaths().reduce((memo, item) => {
    memo[item[0]] = item[1];
    return memo;
  }, {});
}

function addPackageModuleAlias(alias, packageName, subpath, targetFile) {
  if (alias[subpath]) {
    return;
  }
  alias[`${subpath}$`] = path.resolve(process.cwd(), 'node_modules', packageName, targetFile);
}

export function getRsbuildBrowserAlias() {
  const alias = getRsbuildAlias();
  addPackageModuleAlias(alias, '@nocobase/client', '@nocobase/client', 'es/index.mjs');
  addPackageModuleAlias(alias, '@nocobase/client-v2', '@nocobase/client-v2', 'es/index.mjs');
  addPackageModuleAlias(alias, '@nocobase/client-v2', '@nocobase/client-v2/flow-compat', 'es/flow-compat/index.mjs');
  return alias;
}

export { generateV2Plugins, generatePlugins };
