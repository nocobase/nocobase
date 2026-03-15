/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowActionSchemaManifest } from '@nocobase/flow-engine';
import { emptyObjectSchema } from '../shared';

export const aclCheckSchemaManifest: FlowActionSchemaManifest = {
  name: 'aclCheck',
  title: 'ACL check',
  source: 'official',
  strict: false,
  paramsSchema: emptyObjectSchema,
  docs: {
    minimalExample: {},
  },
};
