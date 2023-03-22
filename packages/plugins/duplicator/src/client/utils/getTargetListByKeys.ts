export const getTargetListByKeys = (list: any[], targetKeys: string[]) => {
  const result: any[] = [];
  targetKeys.forEach((targetKey) => {
    const targetItem = list.find((record) => record.key === targetKey);
    if (targetItem) {
      result.push(targetItem);
    }
  });
  return result;
};
