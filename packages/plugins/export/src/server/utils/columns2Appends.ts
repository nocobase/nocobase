export function columns2Appends(columns) {
  const appends = new Set([]);
  for (const column of columns) {
    if (column.dataIndex.length > 1) {
      const appendColumns = [];
      for (let i = 0, iLen = column.dataIndex.length - 1; i < iLen; i++) {
        appendColumns.push(column.dataIndex[i]);
      }
      appends.add(appendColumns.join('.'));
    }
  }
  return Array.from(appends);
}
