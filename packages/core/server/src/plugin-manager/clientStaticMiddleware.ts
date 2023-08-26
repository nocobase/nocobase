const PREFIX = '/api/plugins/client/';

/**
 * get plugin client static file url
 *
 * @example
 * @nocobase/plugin-acl, index.js => /api/plugins/client/@nocobase/plugin-acl/index.js
 * my-plugin, README.md => /api/plugins/client/my-plugin/README.md
 */
export const getPackageClientStaticUrl = (packageName: string, filePath: string) => {
  return `${PREFIX}${packageName}/${filePath}`;
};
