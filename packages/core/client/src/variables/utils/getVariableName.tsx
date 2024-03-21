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
