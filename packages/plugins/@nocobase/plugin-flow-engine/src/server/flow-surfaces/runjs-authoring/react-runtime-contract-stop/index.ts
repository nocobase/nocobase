/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RunJsAuthoringRuleDefinition } from '../types';

export const reactRuntimeContractStopRule: RunJsAuthoringRuleDefinition = {
  repairClass: 'react-runtime-contract-stop',
  defaultRuleId: 'runjs-react-runtime-contract-invalid',
  suggestedAction:
    'Use ctx.React/JSX for elements, call React components through ctx.React.createElement or JSX, and put Hooks inside a rendered React component.',
};
