/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { REGEX_OF_VARIABLE } from './isVariable';

/**
 * `{{ $user.name }}` => `$user.name`
 * @param variableString
 * @returns
 */

export const getPath = (variableString: string) => {
  if (!variableString) {
    return variableString;
  }

  const matches = variableString.match(REGEX_OF_VARIABLE);
  return matches[0].replace(REGEX_OF_VARIABLE, '$1');
};
