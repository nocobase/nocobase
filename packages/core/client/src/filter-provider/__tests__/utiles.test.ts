import { getSupportFieldsByAssociation, getSupportFieldsByForeignKey } from '../utils';

describe('getSupportFieldsByAssociation', () => {
  it('should return all associated fields matching the inherited collections chain', () => {
    const block = {
      associatedFields: [
        { id: 1, target: 'collection1', name: 'field1' },
        { id: 2, target: 'collection2', name: 'field2' },
        { id: 3, target: 'collection1', name: 'field3' },
      ],
    };

    const inheritCollectionsChain = ['collection1', 'collection2'];

    const result = getSupportFieldsByAssociation(inheritCollectionsChain, block as any);

    expect(result).toEqual([
      { id: 1, target: 'collection1', name: 'field1' },
      { id: 2, target: 'collection2', name: 'field2' },
      { id: 3, target: 'collection1', name: 'field3' },
    ]);
  });

  it('should return an empty array when there are no matching associated fields', () => {
    const block = {
      associatedFields: [
        { id: 1, target: 'collection1', name: 'field1' },
        { id: 2, target: 'collection2', name: 'field2' },
        { id: 3, target: 'collection1', name: 'field3' },
      ],
    };

    const inheritCollectionsChain = ['collection3', 'collection4'];

    const result = getSupportFieldsByAssociation(inheritCollectionsChain, block as any);

    expect(result).toEqual([]);
  });

  it('should return associated fields matching the inherited collections chain', () => {
    const block = {
      associatedFields: [
        { id: 1, target: 'collection1', name: 'field1' },
        { id: 2, target: 'collection2', name: 'field2' },
        { id: 3, target: 'collection1', name: 'field3' },
      ],
    };

    const inheritCollectionsChain = ['collection1'];

    const result = getSupportFieldsByAssociation(inheritCollectionsChain, block as any);

    expect(result).toEqual([
      { id: 1, target: 'collection1', name: 'field1' },
      { id: 3, target: 'collection1', name: 'field3' },
    ]);
  });
});

describe('getSupportFieldsByForeignKey', () => {
  it("should return all foreign key fields matching the filter block collection's foreign key properties", () => {
    const filterBlockCollection = {
      fields: [
        { id: 1, name: 'field1', foreignKey: 'fk1' },
        { id: 2, name: 'field2', foreignKey: 'fk2' },
        { id: 3, name: 'field3', foreignKey: 'fk3' },
      ],
    };

    const block = {
      foreignKeyFields: [
        { id: 1, name: 'fk1', target: 'collection1' },
        { id: 2, name: 'fk2', target: 'collection2' },
        { id: 3, name: 'fk4', target: 'collection1' },
      ],
    };

    const result = getSupportFieldsByForeignKey(filterBlockCollection as any, block as any);

    expect(result).toEqual([
      { id: 1, name: 'fk1', target: 'collection1' },
      { id: 2, name: 'fk2', target: 'collection2' },
    ]);
  });

  it('should return an empty array when there are no matching foreign key fields', () => {
    const filterBlockCollection = {
      fields: [
        { id: 1, name: 'field1', foreignKey: 'fk1' },
        { id: 2, name: 'field2', foreignKey: 'fk2' },
        { id: 3, name: 'field3', foreignKey: 'fk3' },
      ],
    };

    const block = {
      foreignKeyFields: [
        { id: 1, name: 'fk4', target: 'collection1' },
        { id: 2, name: 'fk5', target: 'collection2' },
        { id: 3, name: 'fk6', target: 'collection1' },
      ],
    };

    const result = getSupportFieldsByForeignKey(filterBlockCollection as any, block as any);

    expect(result).toEqual([]);
  });

  it("should return foreign key fields matching the filter block collection's foreign key properties", () => {
    const filterBlockCollection = {
      fields: [
        { id: 1, name: 'field1', foreignKey: 'fk1' },
        { id: 2, name: 'field2', foreignKey: 'fk2' },
        { id: 3, name: 'field3', foreignKey: 'fk3' },
      ],
    };

    const block = {
      foreignKeyFields: [
        { id: 1, name: 'fk1', target: 'collection1' },
        { id: 2, name: 'fk2', target: 'collection2' },
        { id: 3, name: 'fk3', target: 'collection1' },
      ],
    };

    const result = getSupportFieldsByForeignKey(filterBlockCollection as any, block as any);

    expect(result).toEqual([
      { id: 1, name: 'fk1', target: 'collection1' },
      { id: 2, name: 'fk2', target: 'collection2' },
      { id: 3, name: 'fk3', target: 'collection1' },
    ]);
  });
});
