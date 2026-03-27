/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowActionSchemaContribution } from '../../flow-schema-registry';
import { openViewParamsSchema } from '../shared';

export const openViewSchemaContribution: FlowActionSchemaContribution = {
  name: 'openView',
  title: 'Edit popup',
  source: 'official',
  strict: false,
  paramsSchema: openViewParamsSchema,
  docs: {
    minimalExample: {
      mode: 'drawer',
      size: 'medium',
      pageModelClass: 'ChildPageModel',
    },
    commonPatterns: [
      {
        title: 'Open a popup child page in drawer mode',
        snippet: {
          mode: 'drawer',
          size: 'medium',
          pageModelClass: 'ChildPageModel',
        },
      },
      {
        title: 'Open a route or embedded root page',
        snippet: {
          mode: 'embed',
          size: 'large',
          pageModelClass: 'RootPageModel',
        },
      },
    ],
  },
};
