/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type SQLVariable = {
  name?: string;
  value?: unknown;
};

export type SQLInstructionConfig = {
  dataSource?: string;
  sql?: string;
  withMeta?: boolean;
  unsafeInjection?: boolean;
  variables?: SQLVariable[];
};
