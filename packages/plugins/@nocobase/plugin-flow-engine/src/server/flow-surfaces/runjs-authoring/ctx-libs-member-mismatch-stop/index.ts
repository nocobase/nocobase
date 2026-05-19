/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RunJsAuthoringRuleDefinition } from '../types';

export const ctxLibsMemberMismatchStopRule: RunJsAuthoringRuleDefinition = {
  repairClass: 'ctx-libs-member-mismatch-stop',
  defaultRuleId: 'runjs-ctx-libs-member-case-invalid',
  suggestedAction:
    'Use exact case-sensitive ctx.libs keys, such as ctx.libs.React, ctx.libs.ReactDOM, and ctx.libs.antdIcons.',
};
