/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const ENV_STRING_CONFIG_FLAG_MAP = {
  source: 'source',
  'download-version': 'downloadVersion',
  'docker-registry': 'dockerRegistry',
  'docker-platform': 'dockerPlatform',
  'git-url': 'gitUrl',
  'npm-registry': 'npmRegistry',
  'app-path': 'appPath',
  'app-root-path': 'appRootPath',
  'storage-path': 'storagePath',
  'app-public-path': 'appPublicPath',
  'cdn-base-url': 'cdnBaseUrl',
  'env-file': 'envFile',
  'app-port': 'appPort',
  'app-key': 'appKey',
  timezone: 'timezone',
  'db-dialect': 'dbDialect',
  'builtin-db-image': 'builtinDbImage',
  'db-host': 'dbHost',
  'db-port': 'dbPort',
  'db-database': 'dbDatabase',
  'db-user': 'dbUser',
  'db-password': 'dbPassword',
  'db-schema': 'dbSchema',
  'db-table-prefix': 'dbTablePrefix',
  'root-username': 'rootUsername',
  'root-email': 'rootEmail',
  'root-password': 'rootPassword',
  'root-nickname': 'rootNickname',
} as const;

export const ENV_BOOLEAN_CONFIG_FLAG_MAP = {
  'builtin-db': 'builtinDb',
  'dev-dependencies': 'devDependencies',
  build: 'build',
  'build-dts': 'buildDts',
  'db-underscored': 'dbUnderscored',
} as const;

export type EnvStringConfigFlagName = keyof typeof ENV_STRING_CONFIG_FLAG_MAP;
export type EnvBooleanConfigFlagName = keyof typeof ENV_BOOLEAN_CONFIG_FLAG_MAP;
