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
const { resolve } = require('path');

const REQUIRED_ENV_VARS = [
  'DOCS_ALI_OSS_ACCESS_KEY_ID',
  'DOCS_ALI_OSS_ACCESS_KEY_SECRET',
  'DOCS_ALI_OSS_BUCKET',
  'DOCS_ALI_OSS_REGION',
  'DOCS_ALI_CDN_DOMAIN',
];

const TIMESTAMP_DIR_PATTERN = /^\d{14}\/$/;
const KEEP_VERSIONS = 1;
const OSS_LIST_MAX_KEYS = 1000;
const OSS_DELETE_BATCH_SIZE = 1000;

/**
 * Normalize domain — strip protocol if present
 * @param {string} domain
 * @returns {string}
 */
function normalizeDomain(domain) {
  return domain.replace(/^https?:\/\//, '').replace(/\/+$/, '');
}

/**
 * Create an Alibaba Cloud CDN client
 * @returns {import('@alicloud/cdn20180510').default}
 */
function createCdnClient() {
  const Cdn20180510 = require('@alicloud/cdn20180510');
  const OpenApi = require('@alicloud/openapi-client');

  const config = new OpenApi.Config({
    accessKeyId: process.env.DOCS_ALI_OSS_ACCESS_KEY_ID,
    accessKeySecret: process.env.DOCS_ALI_OSS_ACCESS_KEY_SECRET,
  });
  config.endpoint = 'cdn.aliyuncs.com';

  return new Cdn20180510.default(config);
}

/**
 * Update CDN origin URL rewrite rule to point to the new timestamp directory
 * @param {import('@alicloud/cdn20180510').default} cdnClient
 * @param {string} domain
 * @param {string} timestampDir
 */
const REWRITE_RULES = [
  // /en/ 下无后缀的页面路由，去掉 /en/ 前缀并改写到目录式 index.html
  { sourceUrl: '^/en/([^.]*[^/.])$', targetTemplate: (ts) => `/${ts}/$1/index.html`, flag: 'break' },
  // 其他语言和默认语言的无后缀页面路由，统一改写到目录式 index.html
  { sourceUrl: '^/([^.]*[^/.])$', targetTemplate: (ts) => `/${ts}/$1/index.html`, flag: 'break' },
  // /en/ 下的静态资源和目录，继续去掉 /en/ 前缀
  { sourceUrl: '^/en/(.*)', targetTemplate: (ts) => `/${ts}/$1`, flag: 'break' },
  // 兜底：所有其他请求继续只补时间戳前缀
  { sourceUrl: '^/(.*)', targetTemplate: (ts) => `/${ts}/$1`, flag: 'break' },
];

async function updateCdnOriginRewrite(cdnClient, domain, timestampDir) {
  const Cdn20180510 = require('@alicloud/cdn20180510');

  // Fetch existing configs to find configIds
  const existingConfigMap = {};
  try {
    const describeRequest = new Cdn20180510.DescribeCdnDomainConfigsRequest({
      domainName: domain,
      functionNames: 'back_to_origin_url_rewrite',
    });
    const describeResponse = await cdnClient.describeCdnDomainConfigs(describeRequest);
    const configs = describeResponse.body?.domainConfigs?.domainConfig;
    if (configs && configs.length > 0) {
      for (const config of configs) {
        const args = config.functionArgs?.functionArg || [];
        const sourceArg = args.find((a) => a.argName === 'source_url');
        if (sourceArg) {
          existingConfigMap[sourceArg.argValue] = config.configId;
        }
      }
    }
  } catch (error) {
    console.log(chalk.yellow(`Could not fetch existing CDN config (may be first deployment): ${error.message}`));
  }

  // Build function configs for all rules
  const functions = REWRITE_RULES.map((rule) => {
    const functionConfig = {
      functionName: 'back_to_origin_url_rewrite',
      functionArgs: [
        { argName: 'source_url', argValue: rule.sourceUrl },
        { argName: 'target_url', argValue: rule.targetTemplate(timestampDir) },
        { argName: 'flag', argValue: rule.flag },
      ],
    };
    if (existingConfigMap[rule.sourceUrl]) {
      functionConfig.configId = existingConfigMap[rule.sourceUrl];
    }
    return functionConfig;
  });

  const setRequest = new Cdn20180510.BatchSetCdnDomainConfigRequest({
    domainNames: domain,
    functions: JSON.stringify(functions),
  });

  await cdnClient.batchSetCdnDomainConfig(setRequest);
}

/**
 * Poll CDN API until the rewrite rule status becomes "success"
 * @param {import('@alicloud/cdn20180510').default} cdnClient
 * @param {string} domain
 * @param {string} timestampDir
 */
async function waitForRewriteRule(cdnClient, domain, timestampDir) {
  const Cdn20180510 = require('@alicloud/cdn20180510');
  const maxAttempts = 180; // 180 * 10s = 30min max
  const interval = 10000;

  for (let i = 1; i <= maxAttempts; i++) {
    try {
      const request = new Cdn20180510.DescribeCdnDomainConfigsRequest({
        domainName: domain,
        functionNames: 'back_to_origin_url_rewrite',
      });
      const response = await cdnClient.describeCdnDomainConfigs(request);
      const configs = response.body?.domainConfigs?.domainConfig;

      if (configs && configs.length > 0) {
        const expectedPrefix = `/${timestampDir}/`;
        const allEffective = REWRITE_RULES.every((rule) => {
          const config = configs.find((c) => {
            const cArgs = c.functionArgs?.functionArg || [];
            const src = cArgs.find((a) => a.argName === 'source_url');
            return src && src.argValue === rule.sourceUrl;
          });
          if (!config) return false;
          const args = config.functionArgs?.functionArg || [];
          const targetArg = args.find((a) => a.argName === 'target_url');
          return config.status === 'success' && (targetArg?.argValue || '').startsWith(expectedPrefix);
        });

        if (allEffective) {
          console.log(chalk.green(`All rewrite rules are effective (attempt ${i}/${maxAttempts})`));
          return;
        }
        console.log(chalk.blue(`Rewrite rules not all effective yet, waiting... (attempt ${i}/${maxAttempts})`));
      }
    } catch (error) {
      console.log(chalk.blue(`Failed to query rule status, retrying... (attempt ${i}/${maxAttempts})`));
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  console.warn(chalk.yellow('Rewrite rule verification timed out after 30min, proceeding with cache refresh anyway'));
}

/**
 * Refresh CDN cache for the domain
 * @param {import('@alicloud/cdn20180510').default} cdnClient
 * @param {string} domain
 */
async function refreshCdnCache(cdnClient, domain) {
  const Cdn20180510 = require('@alicloud/cdn20180510');

  const request = new Cdn20180510.RefreshObjectCachesRequest({
    objectPath: `https://${domain}/`,
    objectType: 'Directory',
  });

  await cdnClient.refreshObjectCaches(request);
}

/**
 * List all objects under a given OSS prefix (handles pagination)
 * @param {import('ali-oss')} ossClient
 * @param {string} prefix
 * @returns {Promise<string[]>} list of object names
 */
async function listAllObjects(ossClient, prefix) {
  const allObjects = [];
  let marker = null;
  let isTruncated = true;

  while (isTruncated) {
    const params = { prefix, 'max-keys': OSS_LIST_MAX_KEYS };
    if (marker) {
      params.marker = marker;
    }

    const result = await ossClient.list(params);
    const objects = result.objects || [];
    for (const obj of objects) {
      allObjects.push(obj.name);
    }

    isTruncated = result.isTruncated;
    marker = result.nextMarker;
  }

  return allObjects;
}

/**
 * Clean up old timestamp directories, keeping the latest N versions
 * @param {import('ali-oss')} ossClient
 * @param {number} keepCount
 */
async function cleanupOldVersions(ossClient, keepCount) {
  const result = await ossClient.list({ prefix: '', delimiter: '/', 'max-keys': OSS_LIST_MAX_KEYS });
  const prefixes = result.prefixes || [];

  const timestampDirs = prefixes.filter((p) => TIMESTAMP_DIR_PATTERN.test(p)).sort();

  if (timestampDirs.length <= keepCount) {
    console.log(chalk.green(`Found ${timestampDirs.length} version(s), no cleanup needed (keeping ${keepCount})`));
    return;
  }

  const dirsToDelete = timestampDirs.slice(0, timestampDirs.length - keepCount);
  console.log(chalk.blue(`Found ${timestampDirs.length} versions, will delete ${dirsToDelete.length} old version(s)`));

  for (const dir of dirsToDelete) {
    console.log(chalk.blue(`  Deleting ${dir}...`));
    const objectNames = await listAllObjects(ossClient, dir);

    for (let i = 0; i < objectNames.length; i += OSS_DELETE_BATCH_SIZE) {
      const batch = objectNames.slice(i, i + OSS_DELETE_BATCH_SIZE);
      await ossClient.deleteMulti(batch, { quiet: true });
    }

    console.log(chalk.green(`  Deleted ${objectNames.length} objects from ${dir}`));
  }
}

/**
 * @param {Command} cli
 */
module.exports = (cli) => {
  cli
    .command('docs:update')
    .option('--timestamp <timestamp>', 'timestamp directory to point CDN to (required)')
    .allowUnknownOption()
    .action(async (options) => {
      // 1. Validate environment variables
      const missingVars = REQUIRED_ENV_VARS.filter((v) => !process.env[v]);
      if (missingVars.length > 0) {
        console.error(chalk.red(`Missing required environment variables: ${missingVars.join(', ')}`));
        process.exit(1);
      }

      // 2. Validate --timestamp
      if (!options.timestamp) {
        console.error(chalk.red('Missing required option: --timestamp <ts>'));
        process.exit(1);
      }

      const timestamp = options.timestamp;
      const domain = normalizeDomain(process.env.DOCS_ALI_CDN_DOMAIN);

      // 3. Create OSS client (for cleanup)
      const Client = require('ali-oss');
      const ossClient = new Client({
        accessKeyId: process.env.DOCS_ALI_OSS_ACCESS_KEY_ID,
        accessKeySecret: process.env.DOCS_ALI_OSS_ACCESS_KEY_SECRET,
        bucket: process.env.DOCS_ALI_OSS_BUCKET,
        region: process.env.DOCS_ALI_OSS_REGION,
      });

      // 4. Update CDN origin rewrite rule
      console.log(chalk.blue(`Updating CDN origin rewrite rule for ${domain}...`));
      try {
        const cdnClient = createCdnClient();
        await updateCdnOriginRewrite(cdnClient, domain, timestamp);
        console.log(chalk.green(`CDN origin rewrite updated to /${timestamp}/`));

        // 5. Poll until rewrite rule takes effect, then refresh CDN cache
        console.log(chalk.blue('Waiting for rewrite rule to propagate...'));
        await waitForRewriteRule(cdnClient, domain, timestamp);
        console.log(chalk.blue('Refreshing CDN cache...'));
        await refreshCdnCache(cdnClient, domain);
        console.log(chalk.green('CDN cache refresh submitted'));
      } catch (error) {
        console.error(chalk.red('CDN update failed (non-fatal):'), error.message);
      }

      // 6. Cleanup old versions (non-fatal)
      console.log(chalk.blue(`Cleaning up old versions (keeping latest ${KEEP_VERSIONS})...`));
      try {
        await cleanupOldVersions(ossClient, KEEP_VERSIONS);
        console.log(chalk.green('Cleanup complete'));
      } catch (error) {
        console.warn(chalk.yellow('Cleanup failed (non-fatal):'), error.message);
      }
    });
};
