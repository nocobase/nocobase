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
    "Use exact case-sensitive ctx.libs keys and supported library exports. For Ant Design color palettes, import '@ant-design/colors' with ctx.importAsync.",
};
