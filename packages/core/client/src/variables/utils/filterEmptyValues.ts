export const filterEmptyValues = (value: any) => {
  if (!Array.isArray(value)) {
    return value;
  }

  return value.filter((item) => {
    return item === 0 || item === false || item;
  });
};
