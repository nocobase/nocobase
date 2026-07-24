import common from './common.js';
import path from 'node:path';
import portalUtils from '@nocobase/utils/portal.js';

const { getPackagePaths, generateV2Plugins, generatePlugins } = common;
const { PortalRequestResolver } = portalUtils;

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

export function createPortalProxyBypass(appPublicPath) {
  const resolver = new PortalRequestResolver();
  return (req) => (resolver.resolve(req.url || '/', appPublicPath) ? undefined : true);
}

export { generateV2Plugins, generatePlugins };
