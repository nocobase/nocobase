/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const AGENT_GATEWAY_RETENTION_DEFAULTS_DAYS = {
  events: 30,
  apiCallLogs: 30,
  artifacts: 90,
  snapshots: 90,
  externalImportBatches: 90,
} as const;
