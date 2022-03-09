export const toGroupDataSource = (groupField: IGroupField, dataSource: Array<any> = []) => {
  if (dataSource.length === 0) {
    return { columns: [] };
  }
  const groupDataSource = [];
  groupField.enum.forEach((item, index) => {
    groupDataSource.push({
      id: item.value,
      title: item.label,
      color: item.color,
      cards: [],
    });
  });
  dataSource.forEach((ds) => {
    const group = groupDataSource.find((g) => g.id === ds[groupField.name]);
    if (group) {
      group.cards.push(ds);
    }
  });
  return { columns: groupDataSource };
};
