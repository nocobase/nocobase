export function columns2Appends(columns, ctx) {
  const { resourceName } = ctx.action;
  const appends = new Set([]);
  for (const column of columns) {
    let collection = ctx.db.getCollection(resourceName);
    const appendColumns = [];
    for (let i = 0, iLen = column.dataIndex.length; i < iLen; i++) {
      let field = collection.getField(column.dataIndex[i]);
      if (field.target) {
        appendColumns.push(column.dataIndex[i]);
        collection = ctx.db.getCollection(field.target);
      }
    }
    if (appendColumns.length > 0) {
      appends.add(appendColumns.join('.'));
    }
  }
  return Array.from(appends);
}
