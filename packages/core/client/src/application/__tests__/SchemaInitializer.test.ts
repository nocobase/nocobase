import { SchemaInitializer } from '../schema-initializer/SchemaInitializer';

describe('SchemaInitializer', () => {
  it('should initialize with default items when no options provided', () => {
    const schema = new SchemaInitializer({ name: 'schema0' });
    expect(schema.items).toEqual([]);
  });

  it('should initialize with provided items', () => {
    const schema = new SchemaInitializer({ type: 'item', items: [{ name: 'test', type: 'item' }], name: 'schema1' });
    expect(schema.items).toEqual([{ type: 'item', name: 'test' }]);
  });

  it('should add item with unique name', () => {
    const schema = new SchemaInitializer({ items: [], name: 'schema2' });
    schema.add('item1', { type: 'item', test: true });
    expect(schema.items).toContainEqual({ type: 'item', name: 'item1', test: true });
  });

  it('should replace item with same name', () => {
    const schema = new SchemaInitializer({
      type: 'item',
      items: [{ type: 'item', name: 'item1', test: false }],
      name: 'schema3',
    });
    schema.add('item1', { type: 'item', test: true });
    expect(schema.items).toContainEqual({ type: 'item', name: 'item1', test: true });
    expect(schema.items.length).toBe(1);
  });

  it('should add children to the specified parent item', () => {
    const schema = new SchemaInitializer({
      type: 'item',
      items: [{ type: 'item', name: 'parent', children: [] }],
      name: 'schema4',
    });
    schema.add('parent.child', { type: 'item', test: true });
    expect(schema.get('parent').children).toContainEqual({ type: 'item', name: 'child', test: true });
  });

  it('should get the item by nested name', () => {
    const schema = new SchemaInitializer({
      type: 'item',
      items: [{ type: 'item', name: 'parent', children: [{ type: 'item', name: 'child', test: true }] }],
      name: 'schema5',
    });
    expect(schema.get('parent.child')).toEqual({ type: 'item', name: 'child', test: true });
  });

  it('should return undefined for non-existent item', () => {
    const schema = new SchemaInitializer({ type: 'item', items: [], name: 'schema6' });
    expect(schema.get('nonexistent')).toBeUndefined();
  });

  it('should remove the specified item', () => {
    const schema = new SchemaInitializer({
      type: 'item',
      items: [{ type: 'item', name: 'toRemove', test: true }],
      name: 'schema7',
    });
    schema.remove('toRemove');
    expect(schema.items).not.toContainEqual({ type: 'item', name: 'toRemove', test: true });
  });

  it('should remove the specified nested item', () => {
    const schema = new SchemaInitializer({
      type: 'item',
      items: [{ type: 'item', name: 'parent', children: [{ type: 'item', name: 'toRemove', test: true }] }],
      name: 'schema8',
    });
    schema.remove('parent.toRemove');
    expect(schema.get('parent').children).not.toContainEqual({ type: 'item', name: 'toRemove', test: true });
  });
});
