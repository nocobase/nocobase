import { Database } from '../database';
import { beforeDefineAdjacencyListCollection } from './adjacency-list';
import { appendChildCollectionNameAfterRepositoryFind } from './append-child-collection-name-after-repository-find';

export const registerBuiltInListeners = (db: Database) => {
  db.on('beforeDefineCollection', beforeDefineAdjacencyListCollection);
  db.on('afterRepositoryFind', appendChildCollectionNameAfterRepositoryFind(db));
};
