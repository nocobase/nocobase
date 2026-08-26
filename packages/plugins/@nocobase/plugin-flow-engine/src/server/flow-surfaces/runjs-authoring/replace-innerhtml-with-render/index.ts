/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RunJsAuthoringRuleDefinition } from '../types';

export const replaceInnerHtmlWithRenderRule: RunJsAuthoringRuleDefinition = {
  repairClass: 'replace-innerhtml-with-render',
  defaultRuleId: 'runjs-render-required',
  suggestedAction: 'Render UI through a directly reachable ctx.render(...) call.',
};
