export const findNestedOption = (value: string[] | string, options = []) => {
  if (typeof value === 'string') {
    value = [value];
  }
  return value?.reduce((cur, v, index) => {
    const matched = cur?.find((item) => item.value === v);
    return index === value.length - 1 ? matched : matched?.children;
  }, options);
};
