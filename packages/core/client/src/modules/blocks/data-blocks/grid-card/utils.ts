export const columnCountMarks = [1, 2, 3, 4, 6, 8, 12, 24].reduce((obj, cur) => {
  obj[cur] = cur;
  return obj;
}, {});
