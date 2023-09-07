import { Collection } from '../collection';
import { hasher } from 'node-object-hash';

const hashSortCoerce = hasher({ sort: true, coerce: true });

export class CollectionSnapshotGenerator {
  constructor(public collection: Collection) {}

  toJSON() {
    // @ts-ignore
    const attributes = JSON.parse(JSON.stringify(this.collection.model.tableAttributes));

    return {
      hash: hashSortCoerce.hash(attributes),
      attributes,
    };
  }
}
