/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowActionSchemaContribution } from '@nocobase/flow-engine';
import { layoutParamsSchema } from '../shared';

export const layoutSchemaContribution: FlowActionSchemaContribution = {
  name: 'layout',
  title: 'Set block layout',
  source: 'official',
  strict: false,
  paramsSchema: layoutParamsSchema,
  docs: {
    minimalExample: {
      layout: 'vertical',
      colon: true,
    },
    commonPatterns: [
      {
        title: 'Vertical form layout',
        snippet: {
          layout: 'vertical',
          colon: true,
        },
      },
      {
        title: 'Horizontal form layout',
        snippet: {
          layout: 'horizontal',
          labelAlign: 'left',
          labelWidth: 120,
          labelWrap: true,
          colon: true,
        },
      },
    ],
  },
};
