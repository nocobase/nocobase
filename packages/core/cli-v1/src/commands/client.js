/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const chalk = require('chalk');
const fs = require('fs-extra');
const { resolve } = require('path');
const { discoverPluginPackages } = require('@nocobase/utils/plugin-package');
const {
  normalizeModernClientPrefix,
  resolveAppClientEntryMode,
  resolvePublicPath,
  storagePathJoin,
} = require('../util');

function replaceRuntimeEnvPlaceholders(data, values) {
  return data
    .replace(/\{\{env.CDN_BASE_URL\}\}/g, values.CDN_BASE_URL)
    .replace(/\{\{env.APP_PUBLIC_PATH\}\}/g, values.APP_PUBLIC_PATH)
    .replace(/\{\{env.APP_MODERN_CLIENT_PREFIX\}\}/g, values.APP_MODERN_CLIENT_PREFIX)
    .replace(/\{\{env.APP_CLIENT_ENTRY_MODE\}\}/g, values.APP_CLIENT_ENTRY_MODE)
    .replace(/\{\{env.API_CLIENT_SHARE_TOKEN\}\}/g, values.API_CLIENT_SHARE_TOKEN)
    .replace(/\{\{env.API_CLIENT_STORAGE_TYPE\}\}/g, values.API_CLIENT_STORAGE_TYPE)
    .replace(/\{\{env.API_CLIENT_STORAGE_PREFIX\}\}/g, values.API_CLIENT_STORAGE_PREFIX)
    .replace(/\{\{env.API_BASE_URL\}\}/g, values.API_BASE_URL)
    .replace(/\{\{env.WS_URL\}\}/g, values.WS_URL)
    .replace(/\{\{env.WS_PATH\}\}/g, values.WS_PATH)
    .replace(/\{\{env.NOCOBASE_APP_DEV\}\}/g, values.NOCOBASE_APP_DEV)
    .replace(/\{\{env.ESM_CDN_BASE_URL\}\}/g, values.ESM_CDN_BASE_URL)
    .replace(/\{\{env.ESM_CDN_SUFFIX\}\}/g, values.ESM_CDN_SUFFIX);
}

function replaceRuntimeAssignment(data, key, value) {
  const literal =
    typeof value === 'boolean' ? String(value) : `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  const assignment = `window['${key}'] = ${literal};`;
  const pattern = new RegExp(`window\\['${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'\\]\\s*=\\s*[^;]*;`);

  return pattern.test(data) ? data.replace(pattern, assignment) : data;
}

function renderExtractedClientIndexHtml(target, version) {
  const indexPath = resolve(target, 'index.html');
  const tplPath = resolve(target, 'index.html.tpl');
  if (!fs.existsSync(indexPath) && !fs.existsSync(tplPath)) {
    return false;
  }

  const appPublicPath = resolvePublicPath(process.env.APP_PUBLIC_PATH || '/');
  const cdnBaseUrl =
    process.env.CDN_BASE_URL || `${appPublicPath.replace(/\/$/, '')}/dist/${version}/`.replace(/^\/\//, '/');
  const values = {
    CDN_BASE_URL: cdnBaseUrl,
    APP_PUBLIC_PATH: appPublicPath,
    APP_MODERN_CLIENT_PREFIX: normalizeModernClientPrefix(process.env.APP_MODERN_CLIENT_PREFIX),
    APP_CLIENT_ENTRY_MODE: resolveAppClientEntryMode(),
    API_CLIENT_SHARE_TOKEN: process.env.API_CLIENT_SHARE_TOKEN || 'false',
    API_CLIENT_STORAGE_TYPE: process.env.API_CLIENT_STORAGE_TYPE || 'localStorage',
    API_CLIENT_STORAGE_PREFIX: process.env.API_CLIENT_STORAGE_PREFIX || 'NOCOBASE_',
    API_BASE_URL: process.env.API_BASE_URL || process.env.API_BASE_PATH || '/api/',
    WS_URL: process.env.WEBSOCKET_URL || '',
    WS_PATH: process.env.WS_PATH || '/ws',
    NOCOBASE_APP_DEV: 'false',
    ESM_CDN_BASE_URL: process.env.ESM_CDN_BASE_URL || 'https://esm.sh',
    ESM_CDN_SUFFIX: process.env.ESM_CDN_SUFFIX || '',
  };
  const sourcePath = fs.existsSync(tplPath) ? tplPath : indexPath;
  let data = replaceRuntimeEnvPlaceholders(fs.readFileSync(sourcePath, 'utf-8'), values)
    .replace(/((?:src|href)=")(?:\.\/)?assets\//g, `$1${values.APP_PUBLIC_PATH}assets/`)
    .replace(/((?:src|href)=")\/assets\//g, `$1${values.APP_PUBLIC_PATH}assets/`)
    .replace('src="/umi.', `src="${values.APP_PUBLIC_PATH}umi.`)
    .replace(/((?:src|href)="[^"]*?)\/{2,}(assets\/)/g, '$1/$2');

  if (values.CDN_BASE_URL) {
    const appBaseUrl = values.CDN_BASE_URL.replace(/\/+$/, '');
    const publicPath = values.APP_PUBLIC_PATH.replace(/\/+$/, '');
    data = data
      .replace(new RegExp(`src="${publicPath}/`, 'g'), `src="${appBaseUrl}/`)
      .replace(new RegExp(`href="${publicPath}/`, 'g'), `href="${appBaseUrl}/`);
  }

  data = replaceRuntimeAssignment(data, '__webpack_public_path__', values.CDN_BASE_URL);
  data = replaceRuntimeAssignment(data, '__nocobase_public_path__', values.APP_PUBLIC_PATH);
  data = replaceRuntimeAssignment(data, '__nocobase_modern_client_prefix__', values.APP_MODERN_CLIENT_PREFIX);
  data = replaceRuntimeAssignment(data, '__nocobase_app_client_entry_mode__', values.APP_CLIENT_ENTRY_MODE);
  data = replaceRuntimeAssignment(data, '__nocobase_api_base_url__', values.API_BASE_URL);
  data = replaceRuntimeAssignment(data, '__nocobase_api_client_storage_prefix__', values.API_CLIENT_STORAGE_PREFIX);
  data = replaceRuntimeAssignment(data, '__nocobase_api_client_storage_type__', values.API_CLIENT_STORAGE_TYPE);
  data = replaceRuntimeAssignment(
    data,
    '__nocobase_api_client_share_token__',
    /^true$/i.test(values.API_CLIENT_SHARE_TOKEN),
  );
  data = replaceRuntimeAssignment(data, '__nocobase_ws_url__', values.WS_URL);
  data = replaceRuntimeAssignment(data, '__nocobase_ws_path__', values.WS_PATH);
  data = replaceRuntimeAssignment(data, '__nocobase_app_dev__', false);
  data = replaceRuntimeAssignment(data, '__esm_cdn_base_url__', values.ESM_CDN_BASE_URL);
  data = replaceRuntimeAssignment(data, '__esm_cdn_suffix__', values.ESM_CDN_SUFFIX);

  fs.writeFileSync(indexPath, data, 'utf-8');
  return true;
}

/**
 * 复制主应用客户端文件
 * @param {string} source - 源目录路径
 * @param {string} target - 目标目录路径
 */
async function copyMainClient(source, target) {
  if (!(await fs.exists(source))) {
    console.warn(chalk.yellow(`Source directory does not exist: ${source}`));
    return false;
  }
  // 确保目标目录存在且为空
  await fs.ensureDir(target);
  await fs.emptyDir(target);
  await fs.copy(source, target, { recursive: true });
  return true;
}

/**
 * 复制插件客户端文件
 * @param {Array<{ packageName: string, resolvedPath: string }>} plugins - 插件清单
 * @param {string} target - 目标目录
 */
async function copyPluginClients(plugins, target) {
  let copiedCount = 0;
  for (const plugin of plugins) {
    for (const lane of ['client', 'client-v2']) {
      const pluginDistClient = resolve(plugin.resolvedPath, `dist/${lane}`);
      if (await fs.exists(pluginDistClient)) {
        const pluginTarget = resolve(target, 'static/plugins', plugin.packageName, 'dist', lane);
        await fs.mkdir(resolve(pluginTarget, '..'), { recursive: true });
        await fs.copy(pluginDistClient, pluginTarget, { recursive: true });
        copiedCount++;
      }
    }
  }
  return copiedCount;
}

async function writeActiveVersion(version) {
  const distClientRoot = storagePathJoin('dist-client');
  const activeVersionFile = resolve(distClientRoot, 'active-version');
  const tempFile = resolve(distClientRoot, `.active-version.${process.pid}.${Date.now()}.tmp`);

  await fs.ensureDir(distClientRoot);
  await fs.writeFile(tempFile, `${version}\n`, 'utf8');
  await fs.move(tempFile, activeVersionFile, { overwrite: true });

  return activeVersionFile;
}

/**
 * 递归上传目录到 OSS
 * @param {Client} client - OSS 客户端实例
 * @param {string} localDir - 本地目录路径
 * @param {string} ossPrefix - OSS 对象前缀（目录路径）
 */
async function uploadDirectoryToOSS(client, localDir, ossPrefix = '') {
  if (!(await fs.exists(localDir))) {
    console.log(chalk.yellow(`Directory does not exist: ${localDir}`));
    return;
  }

  const stats = await fs.stat(localDir);
  if (!stats.isDirectory()) {
    throw new Error(`${localDir} is not a directory`);
  }

  const files = await fs.readdir(localDir);
  let uploadedCount = 0;

  for (const file of files) {
    const filePath = resolve(localDir, file);
    const fileStats = await fs.stat(filePath);

    if (fileStats.isDirectory()) {
      // 递归处理子目录
      const subOssPrefix = ossPrefix ? `${ossPrefix}/${file}` : file;
      const subCount = await uploadDirectoryToOSS(client, filePath, subOssPrefix);
      uploadedCount += subCount;
    } else {
      // 上传文件
      const ossKey = ossPrefix ? `${ossPrefix}/${file}` : file;
      try {
        await client.put(ossKey, filePath);
        // console.log(chalk.green(`Uploaded: ${ossKey}`));
        uploadedCount++;
      } catch (error) {
        console.error(chalk.red(`Failed to upload ${ossKey}:`), error.message);
        throw error;
      }
    }
  }

  return uploadedCount;
}

/**
 *
 * @param {Command} cli
 */
module.exports = (cli) => {
  cli
    .command('client:extract')
    .option('--json', 'Output machine-readable JSON')
    .allowUnknownOption()
    .action(async function () {
      const json = this.opts().json === true;
      const version = require('../../package.json').version;
      const target = storagePathJoin('dist-client', version);
      const mainClientSource = resolve(process.cwd(), 'node_modules/@nocobase/app/dist/client');
      const plugins = await discoverPluginPackages({
        nodeModulesPath: resolve(process.cwd(), 'node_modules'),
      });
      const copiedMainClient = await copyMainClient(mainClientSource, target);
      const renderedMainIndex = copiedMainClient ? renderExtractedClientIndexHtml(target, version) : false;
      const copiedPluginBundles = await copyPluginClients(plugins, target);
      const activeVersionFile = await writeActiveVersion(version);

      if (json) {
        process.stdout.write(
          JSON.stringify({
            version,
            target,
            activeVersionFile,
          }),
        );
        return;
      }

      console.log(
        chalk.green(
          `Extracted client assets ${version} to ${target} (main client: ${
            copiedMainClient ? 'yes' : 'no'
          }, rendered index: ${renderedMainIndex ? 'yes' : 'no'}, plugin bundles: ${copiedPluginBundles}).`,
        ),
      );
    });

  cli
    .command('client:upload')
    .allowUnknownOption()
    .action(async () => {
      const version = require('../../package.json').version;
      const target = storagePathJoin('dist-client', version);

      // 检查必要的环境变量
      if (
        !process.env.CDN_ALI_OSS_ACCESS_KEY_ID ||
        !process.env.CDN_ALI_OSS_ACCESS_KEY_SECRET ||
        !process.env.CDN_ALI_OSS_BUCKET ||
        !process.env.CDN_ALI_OSS_REGION
      ) {
        console.error(
          chalk.red(
            'Missing required environment variables: CDN_ALI_OSS_ACCESS_KEY_ID, CDN_ALI_OSS_ACCESS_KEY_SECRET, CDN_ALI_OSS_BUCKET, CDN_ALI_OSS_REGION',
          ),
        );
        process.exit(1);
      }

      const Client = require('ali-oss');

      const client = new Client({
        accessKeyId: process.env.CDN_ALI_OSS_ACCESS_KEY_ID,
        accessKeySecret: process.env.CDN_ALI_OSS_ACCESS_KEY_SECRET,
        bucket: process.env.CDN_ALI_OSS_BUCKET,
        region: process.env.CDN_ALI_OSS_REGION,
      });

      if (!(await fs.exists(target))) {
        console.error(chalk.red(`Target directory does not exist: ${target}`));
        console.log(chalk.yellow('Please run "client:extract" first to generate the client files.'));
        process.exit(1);
      }

      console.log(chalk.blue(`Uploading directory ${target} to OSS...`));
      const ossPrefix = `${version}`;
      try {
        const uploadedCount = await uploadDirectoryToOSS(client, target, ossPrefix);
        console.log(chalk.green(`Successfully uploaded ${uploadedCount} files to OSS`));
      } catch (error) {
        console.error(chalk.red('Upload failed:'), error);
        process.exit(1);
      }
    });
};

module.exports.renderExtractedClientIndexHtml = renderExtractedClientIndexHtml;
