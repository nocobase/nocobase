import { vi } from 'vitest';
import { Schema } from '@formily/react';
import { createDesignable, Designable } from '../useDesignable';

describe('createDesignable', () => {
  let dn: Designable;
  let schema: Schema;

  beforeEach(() => {
    schema = new Schema({
      type: 'void',
      name: 'global',
      'x-uid': 'global',
      properties: {
        current: {
          type: 'void',
          'x-uid': 'current',
          properties: {
            child: {
              type: 'void',
              'x-uid': 'child',
            },
          },
        },
      },
    });
    dn = createDesignable({
      current: schema.properties.current,
    });
  });

  describe('insert a new node', () => {
    test('insertBeforeBegin', () => {
      dn.insertBeforeBegin({
        name: 'abc',
      });
      expect(schema.toJSON()).toMatchObject({
        type: 'void',
        name: 'global',
        'x-uid': 'global',
        properties: {
          abc: {
            name: 'abc',
            type: 'void',
          },
          current: {
            type: 'void',
            name: 'current',
            'x-uid': 'current',
            properties: {
              child: {
                type: 'void',
                'x-uid': 'child',
              },
            },
          },
        },
      });
      expect(schema.properties.abc['x-uid']).toBeDefined();
      expect(Object.keys(schema.properties)).toEqual(['abc', 'current']);
    });

    test('insertAfterBegin', () => {
      dn.insertAfterBegin({
        name: 'abc',
      });
      expect(Object.keys(schema.properties.current.properties)).toEqual(['abc', 'child']);
      expect(schema.toJSON()).toMatchObject({
        type: 'void',
        name: 'global',
        'x-uid': 'global',
        properties: {
          current: {
            type: 'void',
            name: 'current',
            'x-uid': 'current',
            properties: {
              abc: {
                name: 'abc',
                type: 'void',
              },
              child: {
                type: 'void',
                'x-uid': 'child',
              },
            },
          },
        },
      });
      expect(schema.properties.current.properties.abc['x-uid']).toBeDefined();
    });

    test('insertBeforeEnd', () => {
      dn.insertBeforeEnd({
        name: 'abc',
      });
      expect(schema.toJSON()).toMatchObject({
        type: 'void',
        name: 'global',
        'x-uid': 'global',
        properties: {
          current: {
            type: 'void',
            name: 'current',
            'x-uid': 'current',
            properties: {
              child: {
                type: 'void',
                'x-uid': 'child',
              },
              abc: {
                name: 'abc',
                type: 'void',
              },
            },
          },
        },
      });
      expect(schema.properties.current.properties.abc['x-uid']).toBeDefined();
    });

    test('insertAfterEnd', () => {
      dn.insertAfterEnd({
        name: 'abc',
      });
      expect(schema.toJSON()).toMatchObject({
        type: 'void',
        name: 'global',
        'x-uid': 'global',
        properties: {
          current: {
            type: 'void',
            name: 'current',
            'x-uid': 'current',
            properties: {
              child: {
                type: 'void',
                'x-uid': 'child',
              },
            },
          },
          abc: {
            name: 'abc',
            type: 'void',
          },
        },
      });
      expect(schema.properties.abc['x-uid']).toBeDefined();
      expect(Object.keys(schema.properties)).toEqual(['current', 'abc']);
    });
  });

  describe('move an existing node', () => {
    test('insertBeforeBegin', () => {
      dn.insertBeforeBegin(schema.properties.current.properties.child);
      expect(Object.keys(schema.properties)).toEqual(['child', 'current']);
      expect(schema.properties.current?.properties?.child).toBeUndefined();
    });

    test('insertBeforeBegin', () => {
      dn.insertBeforeBegin({
        type: 'void',
        name: 'a1',
      });
      dn.insertBeforeBegin({
        type: 'void',
        name: 'a2',
      });
      dn.insertBeforeBegin({
        type: 'void',
        name: 'a3',
      });
      expect(Object.keys(schema.properties)).toEqual(['a1', 'a2', 'a3', 'current']);
      dn.insertBeforeBegin(schema.properties.a2);
      expect(Object.keys(schema.properties)).toEqual(['a1', 'a3', 'a2', 'current']);
    });

    test('insertAfterBegin', () => {
      dn.insertBeforeBegin({
        name: 'a1',
      });
      dn.insertAfterBegin(schema.properties.a1);
      expect(Object.keys(schema.properties.current.properties)).toEqual(['a1', 'child']);
      expect(schema.properties.a1).toBeUndefined();
    });

    test('insertBeforeEnd', () => {
      dn.insertBeforeBegin({
        name: 'a1',
      });
      dn.insertBeforeEnd(schema.properties.a1);
      expect(Object.keys(schema.properties.current.properties)).toEqual(['child', 'a1']);
      expect(schema.properties.a1).toBeUndefined();
    });

    test('insertAfterEnd', () => {
      dn.insertAfterEnd(schema.properties.current.properties.child);
      expect(Object.keys(schema.properties)).toEqual(['current', 'child']);
      expect(schema.properties.current?.properties?.child).toBeUndefined();
    });

    test('insertAfterEnd', () => {
      dn.insertAfterEnd({
        type: 'void',
        name: 'a1',
      });
      dn.insertAfterEnd({
        type: 'void',
        name: 'a2',
      });
      dn.insertAfterEnd({
        type: 'void',
        name: 'a3',
      });
      expect(Object.keys(schema.properties)).toEqual(['current', 'a3', 'a2', 'a1']);
      dn.insertAfterEnd(schema.properties.a2);
      expect(Object.keys(schema.properties)).toEqual(['current', 'a2', 'a3', 'a1']);
    });
  });

  describe('recursiveRemoveIfNoChildren', () => {
    test('has child nodes', () => {
      dn.recursiveRemoveIfNoChildren(schema.properties.current);
      expect(schema.properties.current).toBeDefined();
    });

    test('no child nodes', () => {
      dn.recursiveRemoveIfNoChildren(schema.properties.current.properties.child);
      expect(schema.properties.current?.properties?.child).toBeUndefined();
    });
  });

  describe('remove', () => {
    test('without schema', () => {
      dn.remove();
      expect(schema?.properties?.current).toBeUndefined();
    });

    test('without options', () => {
      dn.remove(schema.properties.current.properties.child);
      expect(schema.properties.current).toBeDefined();
      expect(schema.properties.current?.properties?.child).toBeUndefined();
    });

    test('removeParentsIfNoChildren + breakRemoveOn json', () => {
      dn.remove(schema.properties.current.properties.child, {
        removeParentsIfNoChildren: true,
        breakRemoveOn: {
          'x-uid': 'global',
        },
      });
      expect(schema?.properties?.current).toBeUndefined();
    });

    test('removeParentsIfNoChildren + breakRemoveOn function', () => {
      dn.remove(schema.properties.current.properties.child, {
        removeParentsIfNoChildren: true,
        breakRemoveOn: (s) => s['x-uid'] === 'global',
      });
      expect(schema?.properties?.current).toBeUndefined();
    });
  });
});

describe('x-index', () => {
  let dn: Designable;
  let schema: Schema;

  beforeEach(() => {
    schema = new Schema({
      type: 'void',
      name: 'col1',
      'x-uid': 'col1',
      properties: {
        block1: {
          type: 'void',
          'x-index': 1,
        },
        block2: {
          type: 'void',
          'x-index': 2,
        },
        block3: {
          type: 'void',
          'x-index': 3,
        },
        block4: {
          type: 'void',
          'x-index': 4,
        },
        block5: {
          type: 'void',
          'x-index': 5,
        },
      },
    });
  });

  test('insertBeforeBeginOrAfterEnd', () => {
    dn = createDesignable({
      current: schema.properties.block2,
    });
    dn.insertBeforeBeginOrAfterEnd(schema.properties.block5);
    expect(Object.keys(schema.properties)).toEqual(['block1', 'block5', 'block2', 'block3', 'block4']);
  });

  test('insertBeforeBegin', () => {
    dn = createDesignable({
      current: schema.properties.block2,
    });
    dn.insertBeforeBegin({
      name: 'block0',
    });
    expect(Object.keys(schema.properties)).toEqual(['block1', 'block0', 'block2', 'block3', 'block4', 'block5']);
  });

  test('insertAfterEnd', () => {
    dn = createDesignable({
      current: schema.properties.block2,
    });
    dn.insertAfterEnd({
      name: 'block0',
    });
    expect(Object.keys(schema.properties)).toEqual(['block1', 'block2', 'block0', 'block3', 'block4', 'block5']);
  });

  test('insertAfterBegin', () => {
    dn = createDesignable({
      current: schema,
    });
    dn.insertAfterBegin({
      name: 'block0',
    });
    expect(Object.keys(schema.properties)).toEqual(['block0', 'block1', 'block2', 'block3', 'block4', 'block5']);
  });

  test('insertBeforeEnd', () => {
    dn = createDesignable({
      current: schema,
    });
    dn.insertBeforeEnd({
      name: 'block0',
    });
    expect(Object.keys(schema.properties)).toEqual(['block1', 'block2', 'block3', 'block4', 'block5', 'block0']);
  });
});

describe('wrap', () => {
  let dn: Designable;
  let schema: Schema;
  const colWrap = (s) => {
    return {
      name: 'col12',
      type: 'void',
      'x-uid': 'col12',
      properties: {
        [s.name]: s,
      },
    };
  };

  const rowWrap = (s) => {
    return {
      name: 'row2',
      type: 'void',
      'x-uid': 'row2',
      properties: {
        col21: {
          type: 'void',
          'x-uid': 'col21',
          properties: {
            [s.name]: s,
          },
        },
      },
    };
  };

  beforeEach(() => {
    schema = new Schema({
      type: 'void',
      name: 'grid1',
      'x-uid': 'grid1',
      properties: {
        row1: {
          type: 'void',
          'x-uid': 'row1',
          properties: {
            col11: {
              type: 'void',
              'x-uid': 'col11',
              properties: {
                block1: {
                  type: 'void',
                },
              },
            },
          },
        },
      },
    });
  });

  test('insertBeforeBegin', () => {
    dn = createDesignable({
      current: schema.properties.row1.properties.col11,
    });
    const s = {
      type: 'void',
      name: 'block2',
    };
    dn.insertBeforeBegin(s, {
      wrap: colWrap,
    });
    expect(Object.keys(schema.properties.row1.properties)).toEqual(['col12', 'col11']);
    expect(schema.properties.row1.properties.col12.properties.block2).toBeDefined();
  });

  test('insertAfterEnd', () => {
    dn = createDesignable({
      current: schema.properties.row1.properties.col11,
    });
    const s = {
      type: 'void',
      name: 'block2',
    };
    dn.insertAfterEnd(s, {
      wrap: colWrap,
    });
    expect(Object.keys(schema.properties.row1.properties)).toEqual(['col11', 'col12']);
    expect(schema.properties.row1.properties.col12.properties.block2).toBeDefined();
  });

  test('removeParentsIfNoChildren', () => {
    const coldn = createDesignable({
      current: schema.properties.row1.properties.col11,
    });
    const s = {
      type: 'void',
      name: 'block2',
    };
    coldn.insertAfterEnd(s, { wrap: colWrap });
    const griddn = createDesignable({
      current: schema,
    });
    griddn.insertBeforeEnd(schema.properties.row1.properties.col12.properties.block2, {
      wrap: rowWrap,
      removeParentsIfNoChildren: true,
    });
    expect(Object.keys(schema.properties.row1.properties)).toEqual(['col11']);
    expect(Object.keys(schema.properties.row2.properties)).toEqual(['col21']);
    expect(schema.properties.row2.properties.col21.properties.block2).toBeDefined();
  });
});

describe('parentsIn', () => {
  let schema: Schema;

  beforeEach(() => {
    schema = new Schema({
      type: 'void',
      name: 'page',
      properties: {
        menu: {
          type: 'void',
          'x-uid': 'menu',
          properties: {
            item1: {
              type: 'void',
              'x-uid': 'item1',
            },
            item2: {
              type: 'void',
              'x-uid': 'item2',
            },
          },
        },
      },
    });
  });

  test('parentsIn', () => {
    const dn = createDesignable({
      current: schema.properties.menu.properties.item1,
    });
    const callback = vi.fn();
    dn.on('error', callback);
    dn.insertAfterBegin(schema.properties.menu);
    expect(schema.properties.menu).toBeDefined();
    expect(callback.mock.calls[0][0].code).toBe('parent_is_not_allowed');
  });
});
