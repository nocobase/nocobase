/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { evaluators } from '@nocobase/evaluators/client';
import { replaceVariables } from '../schema-settings/LinkageRules/bindLinkageRulesToFiled';

export const getVariableValue = async (text: string, scopes) => {
  if (!text) {
    return text;
  }

  const { evaluate } = evaluators.get('string');

  const { exp, scope: expScope } = await replaceVariables(text, scopes);
  const result = evaluate(exp, { now: () => new Date().toString(), ...expScope });
  return result;
};
