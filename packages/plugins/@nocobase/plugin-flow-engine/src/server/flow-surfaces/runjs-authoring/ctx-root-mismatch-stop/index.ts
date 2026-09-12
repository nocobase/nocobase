/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RunJsAuthoringRuleDefinition } from '../types';

export const ctxRootMismatchStopRule: RunJsAuthoringRuleDefinition = {
  repairClass: 'ctx-root-mismatch-stop',
  defaultRuleId: 'runjs-ctx-root-unknown',
  suggestedAction: 'Use an explicit ctx member supported by the selected JS surface.',
};
