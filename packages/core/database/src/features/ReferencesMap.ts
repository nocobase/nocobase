interface Reference {
  sourceCollectionName: string;
  sourceField: string;
  targetField: string;
  targetCollectionName: string;
  onDelete: string;
}

class ReferencesMap {
  protected map: Map<string, Reference[]> = new Map();

  addReference(reference: Reference) {
    this.map.set(reference.targetCollectionName, [...(this.map.get(reference.targetCollectionName) || []), reference]);
  }

  getReferences(collectionName) {
    return this.map.get(collectionName);
  }
}

export default ReferencesMap;
