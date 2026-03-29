/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

function createPluginClientPublicPathDataUri(packageName: string, clientDistDir: string) {
  const code = `
var publicPath = '';
var currentScript = typeof document !== 'undefined' ? document.currentScript : null;
if (currentScript && currentScript.src) {
  publicPath = currentScript.src
    .replace(/^blob:/, '')
    .replace(/#.*$/, '')
    .replace(/\\?.*$/, '')
    .replace(/\\/[^\\/]+$/, '/');
}
if (!publicPath) {
  var runtimeAssetBase = window['__webpack_public_path__'] || '';
  if (runtimeAssetBase) {
    if (runtimeAssetBase.charAt(runtimeAssetBase.length - 1) !== '/') {
      runtimeAssetBase += '/';
    }
    publicPath = runtimeAssetBase + 'static/plugins/${packageName}/dist/${clientDistDir}/';
  }
}
if (!publicPath) {
  publicPath = window['__nocobase_public_path__'] || '';
  if (!publicPath && window.location && window.location.pathname) {
    var marker = '/v2/';
    var pathname = window.location.pathname || '/';
    var index = pathname.indexOf(marker);
    publicPath = index >= 0 ? pathname.slice(0, index + 1) : '/';
  }
  if (publicPath) {
    publicPath = publicPath.replace(/\\/v2\\/?$/, '/');
  }
  if (!publicPath) {
    publicPath = '/';
  }
  if (publicPath.charAt(publicPath.length - 1) !== '/') {
    publicPath += '/';
  }
  publicPath += 'static/plugins/${packageName}/dist/${clientDistDir}/';
}
__webpack_public_path__ = publicPath;
`;

  return `data:text/javascript,${encodeURIComponent(code)}`;
}

function prependPluginClientPublicPathEntry(entry: unknown, packageName: string, clientDistDir: string): unknown {
  const dataUri = createPluginClientPublicPathDataUri(packageName, clientDistDir);

  if (typeof entry === 'string') {
    return [dataUri, entry];
  }

  if (Array.isArray(entry)) {
    return [dataUri, ...entry];
  }

  if (!entry || typeof entry !== 'object') {
    return entry;
  }

  const entryConfig = entry as Record<string, any>;
  if (entryConfig.import) {
    return {
      ...entryConfig,
      import: Array.isArray(entryConfig.import) ? [dataUri, ...entryConfig.import] : [dataUri, entryConfig.import],
    };
  }

  return Object.fromEntries(
    Object.entries(entryConfig).map(([name, value]) => [
      name,
      prependPluginClientPublicPathEntry(value, packageName, clientDistDir),
    ]),
  );
}

export class AutoInjectPublicPathPlugin {
  constructor(
    private pluginName: string,
    private clientDistDir = 'client',
  ) {}

  apply(compiler) {
    compiler.hooks.environment.tap('AutoInjectPublicPathPlugin', () => {
      compiler.options.entry = prependPluginClientPublicPathEntry(
        compiler.options.entry,
        this.pluginName,
        this.clientDistDir,
      ) as any;
    });
  }
}
