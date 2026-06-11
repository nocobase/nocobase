/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const NAMESPACE = 'workflow';

export const EXECUTION_REASON = {
  TIMEOUT: 'timeout',
  MANUAL_CANCEL: 'manual_cancel',
  PARENT_ABORTED: 'parent_aborted',
} as const;
