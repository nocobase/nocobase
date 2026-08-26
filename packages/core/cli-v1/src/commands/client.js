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
const { storagePathJoin } = require('../util');

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
          }, plugin bundles: ${copiedPluginBundles}).`,
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
