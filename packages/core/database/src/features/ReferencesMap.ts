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
    if (!reference.onDelete) {
      reference.onDelete = 'SET NULL';
    }

    this.map.set(reference.targetCollectionName, [...(this.map.get(reference.targetCollectionName) || []), reference]);
  }

  getReferences(collectionName) {
    return this.map.get(collectionName);
  }

  removeReference(reference: Reference) {
    const references = this.map.get(reference.targetCollectionName);

    const keys = Object.keys(reference);

    this.map.set(
      reference.targetCollectionName,
      references.filter((ref) => !keys.every((key) => ref[key] === reference[key])),
    );
  }
}

export default ReferencesMap;
