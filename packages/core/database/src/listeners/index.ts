import { Database } from '../database';
import { afterDefineAdjacencyListCollection, beforeDefineAdjacencyListCollection } from './adjacency-list';

export const registerBuiltInListeners = (db: Database) => {
  db.on('beforeDefineCollection', beforeDefineAdjacencyListCollection);
  db.on('afterDefineCollection', afterDefineAdjacencyListCollection);
};
