export function parseCollectionName(collection: string) {
  if (!collection) {
    return [];
  }
  const dataSourceCollection = collection.split(':');
  const collectionName = dataSourceCollection.pop();
  const dataSourceName = dataSourceCollection[0] ?? 'main';
  return [dataSourceName, collectionName];
}

export function joinCollectionName(dataSourceName: string, collectionName: string) {
  if (!dataSourceName || dataSourceName === 'main') {
    return collectionName;
  }
  return `${dataSourceName}:${collectionName}`;
}
