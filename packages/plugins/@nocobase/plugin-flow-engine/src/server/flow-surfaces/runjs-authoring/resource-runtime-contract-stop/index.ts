/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RunJsAuthoringRuleDefinition } from '../types';

export const resourceRuntimeContractStopRule: RunJsAuthoringRuleDefinition = {
  repairClass: 'resource-runtime-contract-stop',
  defaultRuleId: 'runjs-resource-runtime-contract-invalid',
  suggestedAction:
    'Pass a FlowResource class name such as "MultiRecordResource" to ctx.makeResource(...), set the collection with resource.setResourceName(...), then call refresh() and read getData()/getMeta().',
};
