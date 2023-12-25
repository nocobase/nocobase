import { Collection } from '../collection';
import { hasher } from 'node-object-hash';

const hashSortCoerce = hasher({ sort: true, coerce: true });

export class CollectionSnapshotGenerator {
  constructor(public collection: Collection) {}

  toJSON() {
    // @ts-ignore
    const attributes = JSON.parse(JSON.stringify(this.collection.model.tableAttributes));

    const tableInfo = {
      tableName: this.collection.getTableNameWithSchemaAsString(),
    };

    if (this.collection.isInherited()) {
      tableInfo['inherits'] = this.collection.options.inherits;
    }

    return {
      hash: hashSortCoerce.hash(attributes),
      attributes,
      tableInfo,
    };
  }
}
