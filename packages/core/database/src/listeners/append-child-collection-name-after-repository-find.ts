import Database from '../database';

const setRowAttribute = (row, attribute, value, raw) => {
  if (raw) {
    row[attribute] = value;
  } else {
    row.set(attribute, value, { raw: true });
  }
};

export const appendChildCollectionNameAfterRepositoryFind = (db: Database) => {
  return ({ findOptions, dataCollection, data }) => {
    if (findOptions.targetCollection) {
      const collection = db.getCollection(findOptions.targetCollection);

      for (const row of data) {
        setRowAttribute(row, '__collection', collection.name, findOptions.raw);
        setRowAttribute(row, '__schemaName', collection.collectionSchema(), findOptions.raw);
        setRowAttribute(row, '__tableName', collection.model.tableName, findOptions.raw);
      }

      return;
    }

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

        setRowAttribute(row, '__collection', rowCollectionName, findOptions.raw);
      }
    }
  };
};
