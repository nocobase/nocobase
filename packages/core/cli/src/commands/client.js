/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const chalk = require('chalk');
const { Command } = require('commander');
const fs = require('fs-extra');
const { resolve } = require('path');

/**
 * 复制主应用客户端文件
 * @param {string} source - 源目录路径
 * @param {string} target - 目标目录路径
 */
async function copyMainClient(source, target) {
  if (!(await fs.exists(source))) {
    console.log(chalk.yellow(`Source directory does not exist: ${source}`));
    return;
  }
  // 确保目标目录存在且为空
  await fs.ensureDir(target);
  await fs.emptyDir(target);
  await fs.copy(source, target, { recursive: true });
  console.log(chalk.green(`Copied main client files from ${source} to ${target}`));
}

/**
 * 复制插件客户端文件
 * @param {string} pluginsBaseDir - 插件基础目录路径
 * @param {string} namespace - 命名空间（如 '@nocobase' 或 '@nocobase-example'）
 * @param {string} target - 目标目录
 */
async function copyPluginClients(pluginsBaseDir, namespace, target) {
  const pluginsDir = resolve(process.cwd(), pluginsBaseDir, namespace);
  if (await fs.exists(pluginsDir)) {
    const pluginNames = await fs.readdir(pluginsDir);
    for (const pluginName of pluginNames) {
      const pluginPath = resolve(pluginsDir, pluginName);
      const pluginDistClient = resolve(pluginPath, 'dist/client');
      if (await fs.exists(pluginDistClient)) {
        const pluginTarget = resolve(target, 'static/plugins', namespace, pluginName, 'dist/client');
        await fs.mkdir(resolve(pluginTarget, '..'), { recursive: true });
        await fs.copy(pluginDistClient, pluginTarget, { recursive: true });
        console.log(chalk.green(`Copied ${namespace}/${pluginName} client files`));
      }
    }
  }
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
    .allowUnknownOption()
    .action(async () => {
      const version = require('../../package.json').version;
      const target = resolve(process.cwd(), 'storage/dist-client', version);
      const mainClientSource = resolve(process.cwd(), 'node_modules/@nocobase/app/dist/client');
      await copyMainClient(mainClientSource, target);
      await copyPluginClients('packages/plugins', '@nocobase', target);
      await copyPluginClients('packages/plugins', '@nocobase-example', target);
      await copyPluginClients('packages/pro-plugins', '@nocobase', target);
    });

  cli
    .command('client:upload')
    .allowUnknownOption()
    .action(async () => {
      const version = require('../../package.json').version;
      const target = resolve(process.cwd(), 'storage/dist-client', version);

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
