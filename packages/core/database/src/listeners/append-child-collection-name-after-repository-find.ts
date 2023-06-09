export const appendChildCollectionNameAfterRepositoryFind = (db) => {
  return ({ findOptions, dataCollection, data }) => {
    if (dataCollection.isParent()) {
      for (const row of data) {
        if (row.__collection) {
          continue;
        }

        const fullTableName = findOptions.raw
          ? `${row['__schemaName']}.${row['__tableName']}`
          : `${row.get('__schemaName')}.${row.get('__tableName')}`;

        const rowCollection = db.tableNameCollectionMap.get(fullTableName);

        if (!rowCollection) {
          db.logger.warn(
            `Can not find collection by table name ${JSON.stringify(row)}, current collections: ${Array.from(
              db.tableNameCollectionMap.keys(),
            ).join(', ')}`,
          );

          return;
        }

        const rowCollectionName = rowCollection.name;

        findOptions.raw
          ? (row['__collection'] = rowCollectionName)
          : row.set('__collection', rowCollectionName, {
              raw: true,
            });
      }
    }
  };
};
