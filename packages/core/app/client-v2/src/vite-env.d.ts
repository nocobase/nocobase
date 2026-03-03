/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_API_CLIENT_STORAGE_PREFIX?: string;
  readonly VITE_API_CLIENT_STORAGE_TYPE?: string;
  readonly VITE_API_CLIENT_SHARE_TOKEN?: string;
  readonly VITE_WS_URL?: string;
  readonly VITE_WS_PATH?: string;
  readonly VITE_ESM_CDN_BASE_URL?: string;
  readonly VITE_ESM_CDN_SUFFIX?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
