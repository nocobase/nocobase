import { Collection } from '../collection';
import { AdjacencyListExtender } from './adjacency-list-extender';

export abstract class CollectionExtender {
  static condition: (options: any) => boolean;
  apply: (collection: Collection) => void;
}

export function applyExtenders(collection: Collection) {
  const extenderClasses = [AdjacencyListExtender];

  for (const extenderClass of extenderClasses) {
    if (extenderClass.condition(collection.options)) {
      console.log('apply extender', extenderClass.name);
      const extender = new extenderClass();
      extender.apply(collection);
    }
  }
}
