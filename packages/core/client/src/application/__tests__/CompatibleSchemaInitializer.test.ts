import { CompatibleSchemaInitializer } from '../schema-initializer/CompatibleSchemaInitializer';

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
