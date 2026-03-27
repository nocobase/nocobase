/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowActionSchemaContribution } from '../../flow-schema-registry';
import { aclCheckRefreshParamsSchema } from '../shared';

export const aclCheckRefreshSchemaContribution: FlowActionSchemaContribution = {
  name: 'aclCheckRefresh',
  title: 'ACL check refresh',
  source: 'official',
  strict: false,
  paramsSchema: aclCheckRefreshParamsSchema,
  docs: {
    minimalExample: {},
  },
};
