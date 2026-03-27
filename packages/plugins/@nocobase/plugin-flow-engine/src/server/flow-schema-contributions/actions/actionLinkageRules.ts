/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowActionSchemaContribution } from '../../flow-schema-registry';
import { linkageRuleValueSchema } from '../shared';

export const actionLinkageRulesSchemaContribution: FlowActionSchemaContribution = {
  name: 'actionLinkageRules',
  title: 'Linkage rules',
  source: 'official',
  strict: false,
  paramsSchema: linkageRuleValueSchema,
  docs: {
    minimalExample: {
      value: [],
    },
  },
};
