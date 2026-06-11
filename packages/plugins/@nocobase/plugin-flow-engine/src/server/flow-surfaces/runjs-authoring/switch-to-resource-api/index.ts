/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RunJsAuthoringRuleDefinition } from '../types';

export const switchToResourceApiRule: RunJsAuthoringRuleDefinition = {
  repairClass: 'switch-to-resource-api',
  defaultRuleId: 'runjs-resource-api-required',
  suggestedAction: 'Use ctx.makeResource(...) or ctx.initResource(...) for NocoBase collection access.',
};
