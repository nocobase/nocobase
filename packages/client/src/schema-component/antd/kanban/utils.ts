export const toGroupDataSource = (groupField: IGroupField, dataSource: Array<any> = []) => {
  if (dataSource.length === 0) {
    return { columns: [] };
  }
  const groupDataSource = {
    __unknown__: {
      id: '__unknown__',
      title: 'Unknown',
      color: 'default',
      cards: [],
    },
  };
  groupField.enum.forEach((item) => {
    groupDataSource[item.value] = {
      id: item.value,
      title: item.label,
      color: item.color,
      cards: [],
    };
  });
  dataSource.forEach((ds) => {
    const value = ds[groupField.name];
    if (value && groupDataSource[value]) {
      groupDataSource[value].cards.push(ds);
    } else {
      groupDataSource.__unknown__.cards.push(ds);
    }
  });
  if (groupDataSource.__unknown__.cards.length === 0) {
    delete groupDataSource.__unknown__;
  }
  return { columns: Object.values(groupDataSource) };
};
