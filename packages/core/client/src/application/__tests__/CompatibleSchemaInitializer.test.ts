import { CompatibleSchemaInitializer, isInitializersSame } from '../schema-initializer/CompatibleSchemaInitializer';

describe('CompatibleSchemaInitializer', () => {
  it('should synchronize add operations between instances', () => {
    const first = new CompatibleSchemaInitializer({ type: 'item', items: [], name: 'firstSchema' });
    const second = new CompatibleSchemaInitializer({ type: 'item', items: [], name: 'secondSchema' }, first);
    first.add('item1', { type: 'item', test: true });
    expect(second.items).toContainEqual({ type: 'item', name: 'item1', test: true });
    expect(first.items).toContainEqual({ type: 'item', name: 'item1', test: true });
  });

  it('should synchronize remove operations between instances', () => {
    const first = new CompatibleSchemaInitializer({
      type: 'item',
      items: [{ type: 'item', name: 'toRemove', test: true }],
      name: 'firstSchema',
    });
    const second = new CompatibleSchemaInitializer(
      { type: 'item', items: [{ type: 'item', name: 'toRemove', test: true }], name: 'secondSchema' },
      first,
    );
    first.remove('toRemove');
    expect(first.items).not.toContainEqual({ type: 'item', name: 'toRemove', test: true });
    expect(second.items).not.toContainEqual({ type: 'item', name: 'toRemove', test: true });
  });
});

describe('isInitializersSame', () => {
  test('should return true for matching old and new names directly', () => {
    expect(isInitializersSame('page:addBlock', 'page:addBlock')).toBeTruthy();
  });

  test('should return true for an old name matching a new name via the mapping', () => {
    expect(isInitializersSame('BlockInitializers', 'page:addBlock')).toBeTruthy();
  });

  test('should return false when old name does not match and is not found in mapping', () => {
    expect(isInitializersSame('NonExistentInitializer', 'page:addBlock')).toBeFalsy();
  });

  test('should handle case where old name is in the map but does not match the new name', () => {
    expect(isInitializersSame('BlockInitializers', 'mobilePage:addBlock')).toBeFalsy();
  });

  test('should return true for complex name structures that match through the mapping', () => {
    expect(isInitializersSame('CreateFormBlockInitializers', 'popup:addNew:addBlock')).toBeTruthy();
  });

  test('should return false for complex name structures that do not match any new name', () => {
    expect(isInitializersSame('CreateFormBlockInitializers', 'nonExistentAction')).toBeFalsy();
  });

  test('should return true for new names that match directly and are not in the mapping', () => {
    expect(isInitializersSame('unmappedNewInitializer:action', 'unmappedNewInitializer:action')).toBeTruthy();
  });

  test('should return false for old names trying to match to unrelated new names', () => {
    expect(isInitializersSame('BlockInitializers', 'unrelatedNewInitializer:action')).toBeFalsy();
  });

  test('should handle empty strings', () => {
    expect(isInitializersSame('', '')).toBeTruthy();
    expect(isInitializersSame('', 'page:addBlock')).toBeFalsy();
    expect(isInitializersSame('BlockInitializers', '')).toBeFalsy();
  });
});
