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
