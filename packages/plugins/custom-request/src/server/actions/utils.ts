export const formatParamsIntoObject = (object: { key: string; value: string }[]) => {
  return object.reduce((prev, curr) => {
    prev[curr?.key] = curr.value;
    return prev;
  }, {});
};

export const NAME_SPACE = 'custom-request';
