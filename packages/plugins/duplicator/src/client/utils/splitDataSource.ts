export const splitDataSource = ({ dataSource, targetKeys = [] }) => {
  const leftDataSource = dataSource.filter(({ key }) => targetKeys.indexOf(key) === -1);
  const rightDataSource = [];
  targetKeys.forEach((targetKey) => {
    const targetItem = dataSource.filter((record) => record.key === targetKey)[0];
    if (targetItem) {
      rightDataSource.push(targetItem);
    }
  });

  return {
    leftDataSource,
    rightDataSource,
  };
};
