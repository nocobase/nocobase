import { Database } from '../database';
import { beforeDefineAdjacencyListCollection } from './adjacency-list';

export const registerBuiltInListeners = (db: Database) => {
  db.on('beforeDefineCollection', beforeDefineAdjacencyListCollection);
};
