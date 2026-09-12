/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

interface ImportMetaEnv {
  readonly BASE_URL?: string;
  readonly API_BASE_URL?: string;
  readonly API_CLIENT_STORAGE_PREFIX?: string;
  readonly API_CLIENT_STORAGE_TYPE?: string;
  readonly API_CLIENT_SHARE_TOKEN?: string;
  readonly WS_URL?: string;
  readonly WS_PATH?: string;
  readonly ESM_CDN_BASE_URL?: string;
  readonly ESM_CDN_SUFFIX?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
