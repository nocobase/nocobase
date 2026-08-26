/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RunJsAuthoringRuleDefinition } from '../types';

export const unknownGlobalStopRule: RunJsAuthoringRuleDefinition = {
  repairClass: 'unknown-global-stop',
  defaultRuleId: 'runjs-global-unknown',
  suggestedAction: 'Use a supported ctx API or declare/import a local variable before using it.',
};
