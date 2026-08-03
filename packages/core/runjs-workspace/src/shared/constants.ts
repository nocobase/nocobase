/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const maxFileSize = 1024 * 1024;
export const maxFilesPerRepo = 200;
export const maxRepoTextSize = 10 * 1024 * 1024;
export const diffMaxFileSize = 1024 * 1024;
export const maxCommitMessageLength = 4000;
export const maxPathLength = 512;
export const commitHistoryDefaultLimit = 50;
export const commitHistoryMaxLimit = 200;

export const defaultVscFileLimits = {
  maxFileSize,
  maxFilesPerRepo,
  maxRepoTextSize,
  diffMaxFileSize,
  maxCommitMessageLength,
  maxPathLength,
  commitHistoryDefaultLimit,
  commitHistoryMaxLimit,
} as const;
export const VSC_FILE_NAMESPACE = '@nocobase/plugin-vsc-file';

/**
 * Canonical persisted owner type for repositories created by the product now named JS templates.
 * This legacy value is part of the VSC permission boundary and must remain readable and writable.
 */
export const LIGHT_EXTENSION_PERSISTED_VSC_OWNER_TYPE = 'light-extension';
