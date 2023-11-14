export const REGEX_OF_VARIABLE = /\{\{\s*([a-zA-Z0-9_$-.]+?)\s*\}\}/g;

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
