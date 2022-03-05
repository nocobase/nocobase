export const toGroupDataSource = (groupField: IGroupField, dataSource: Array<any> = []) => {
  if (dataSource.length === 0) {
    return { columns: [] };
  }
  const groupDataSource = [];
  dataSource.forEach((ds) => {
    const group = groupDataSource.find((g) => g.name === ds[groupField.name]);
    if (group) {
      group.cards.push(ds);
    } else {
      const title = groupField.enum.find((item) => item.value === ds[groupField.name]).label;
      groupDataSource.push({
        id: ds[groupField.name],
        name: ds[groupField.name],
        title: title,
        cards: [ds],
      });
    }
  });
  return { columns: groupDataSource };
};
