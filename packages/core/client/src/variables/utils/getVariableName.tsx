/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import { getPath } from './getPath';

/**
 * `{{ $user.name }}` => `$user`
 * @param variableString
 * @returns
 */

export const getVariableName = (variableString: string) => {
  if (!_.isString(variableString)) {
    return variableString;
  }

  const variablePath = getPath(variableString);
  const list = variablePath.split('.');
  const variableName = list[0];

  return variableName;
};
