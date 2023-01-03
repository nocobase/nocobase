import lodash from 'lodash';

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

    const existReference = this.existReference(reference);

    if (existReference && existReference.onDelete !== reference.onDelete) {
      if (reference.onDelete === 'SET NULL') {
        // using existing reference
        return;
      } else if (existReference.onDelete === 'SET NULL') {
        existReference.onDelete = reference.onDelete;
      } else {
        throw new Error(
          `On Delete Conflict, exist reference ${JSON.stringify(existReference)}, new reference ${JSON.stringify(
            reference,
          )}`,
        );
      }
    }

    if (!existReference) {
      this.map.set(reference.targetCollectionName, [
        ...(this.map.get(reference.targetCollectionName) || []),
        reference,
      ]);
    }
  }

  getReferences(collectionName) {
    return this.map.get(collectionName);
  }

  existReference(reference: Reference) {
    const references = this.map.get(reference.targetCollectionName);

    if (!references) {
      return null;
    }

    const keys = Object.keys(reference).filter((k) => k !== 'onDelete');

    return references.find((ref) => keys.every((key) => ref[key] === reference[key]));
  }

  removeReference(reference: Reference) {
    const references = this.map.get(reference.targetCollectionName);
    if (!references) {
      return;
    }

    const keys = ['sourceCollectionName', 'sourceField', 'targetField', 'targetCollectionName'];

    this.map.set(
      reference.targetCollectionName,
      references.filter((ref) => !keys.every((key) => ref[key] === reference[key])),
    );
  }
}

export default ReferencesMap;
