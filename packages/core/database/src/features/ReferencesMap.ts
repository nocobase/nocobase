
export interface Reference {
  sourceCollectionName: string;
  sourceField: string;
  targetField: string;
  targetCollectionName: string;
  onDelete: string;
}

class ReferencesMap {
  protected map: Map<string, Reference[]> = new Map();

  addReference(reference: Reference) {
    const existReference = this.existReference(reference);

    if (existReference) {
      if (reference.onDelete && existReference.onDelete !== reference.onDelete) {
        throw new Error(`On Delete Conflict, exist reference ${existReference.onDelete}, new reference ${reference.onDelete}`)
      }

      return;
    }

    if (!reference.onDelete) {
      reference.onDelete = 'SET NULL';
    }


    this.map.set(reference.targetCollectionName, [...(this.map.get(reference.targetCollectionName) || []), reference]);
  }

  getReferences(collectionName) {
    return this.map.get(collectionName);
  }

  existReference(reference: Reference) {
    const references = this.map.get(reference.targetCollectionName);

    if (!references) {
      return null
    }

    const keys = Object.keys(reference).filter(k => k !== 'onDelete');

    return references.find((ref) => keys.every((key) => ref[key] === reference[key]));
  }

  removeReference(reference: Reference) {
    const references = this.map.get(reference.targetCollectionName);
    if (!references) {
      return;
    }
    const keys = Object.keys(reference);

    this.map.set(
      reference.targetCollectionName,
      references.filter((ref) => !keys.every((key) => ref[key] === reference[key])),
    );
  }
}

export default ReferencesMap;
