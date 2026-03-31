/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const REGEX_OF_VARIABLE = /^\s*\{\{\s*([\p{L}0-9_$-.]+?)\s*\}\}\s*$/u;
export const REGEX_OF_VARIABLE_IN_EXPRESSION = /\{\{\s*([a-zA-Z0-9_$-.]+?)\s*\}\}/g;

export const isVariable = (str: unknown) => {
  if (typeof str !== 'string') {
    return false;
  }
  const matches = str.match(REGEX_OF_VARIABLE);

  if (!matches) {
    return false;
  }

  return true;
};

export const getVariablesFromExpression = (str: string) => {
  const matches = str.match(REGEX_OF_VARIABLE_IN_EXPRESSION);
  if (!matches) {
    return [];
  }
  return matches;
};
