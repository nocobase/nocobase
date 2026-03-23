import common from './common.js';

const { getPackagePaths, generateV2Plugins, generatePlugins } = common;

export function getRsbuildAlias() {
  return getPackagePaths().reduce((memo, item) => {
    memo[item[0]] = item[1];
    return memo;
  }, {});
}

export { generateV2Plugins, generatePlugins };
