/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RunJsAuthoringRuleDefinition } from '../types';

export const renderUnreachableRenderCallRule: RunJsAuthoringRuleDefinition = {
  repairClass: 'render-unreachable-render-call',
  defaultRuleId: 'runjs-render-unreachable',
  suggestedAction: 'Move ctx.render(...) before any top-level return and out of callbacks or uncalled functions.',
};
