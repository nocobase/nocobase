/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RunJsAuthoringRuleDefinition } from '../types';

export const nestedRunjsStopRule: RunJsAuthoringRuleDefinition = {
  repairClass: 'nested-runjs-stop',
  defaultRuleId: 'runjs-nested-runjs-forbidden',
  suggestedAction: 'Write the JavaScript directly in the current RunJS body instead of calling ctx.runjs(...).',
};
