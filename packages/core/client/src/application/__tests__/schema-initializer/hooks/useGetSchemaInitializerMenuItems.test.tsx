/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { renderHook, act } from '@testing-library/react-hooks';
import { useGetSchemaInitializerMenuItems, useSchemaInitializerMenuItems } from '@nocobase/client'; // Adjust the import according to the file structure
import React from 'react';

describe('useGetSchemaInitializerMenuItems', () => {
  const mockOnClick = vitest.fn();
  it('should compile and return an empty array if items are empty', () => {
    const { result } = renderHook(() => useGetSchemaInitializerMenuItems(mockOnClick));
    act(() => {
      const menuItems = result.current([], 'parent-0');
      expect(menuItems).toEqual([]);
    });
  });

  it('should process and return compiled items with a divider', () => {
    const items = [{ type: 'divider' }];
    const { result } = renderHook(() => useGetSchemaInitializerMenuItems(mockOnClick));
    act(() => {
      const menuItems = result.current(items, 'parent-1');
      expect(menuItems).toEqual([{ type: 'divider', key: 'divider-0' }]);
    });
  });

  it('returns items and click', () => {
    const items = [
      {
        type: 'item',
        title: 'item1',
        onClick: vitest.fn(),
      },
      {
        type: 'item',
        label: 'item2',
      },
      {
        type: 'item',
        label: 'item3',
        associationField: 'a.b',
      },
      {
        type: 'item',
        label: 'item4',
        key: 'item4',
        component: () => <div>item4</div>,
      },
      {
        type: 'item',
        label: 'item5',
        component: () => <div>item5</div>,
      },
    ];

    const { result } = renderHook(() => useGetSchemaInitializerMenuItems(mockOnClick));
    act(() => {
      const menuItems = result.current(items, 'parent-2');
      menuItems[0].onClick({ domEvent: { stopPropagation: vitest.fn() }, key: menuItems[0].key });

      expect(items[0].onClick).toHaveBeenCalled();
      expect(result.current(items, 'parent-2')).toMatchInlineSnapshot(`
        [
          {
            "key": "parent-2-item1-0",
            "label": "item1",
            "onClick": [Function],
            "style": undefined,
          },
          {
            "key": "parent-2-item2-1",
            "label": "item2",
            "onClick": [Function],
            "style": undefined,
          },
          {
            "associationField": "a.b",
            "key": "parent-2-item3-2",
            "label": "item3",
            "onClick": [Function],
          },
          {
            "key": "item4",
            "label": <Memo(SchemaInitializerChild)
              component={[Function]}
              label="item4"
              title="item4"
              type="item"
            />,
          },
          {
            "key": "item5-4",
            "label": <Memo(SchemaInitializerChild)
              component={[Function]}
              label="item5"
              title="item5"
              type="item"
            />,
          },
        ]
      `);
      expect(mockOnClick).not.toHaveBeenCalled();

      menuItems[1].onClick({ domEvent: { stopPropagation: vitest.fn() }, key: menuItems[1].key });
      expect(mockOnClick).toHaveBeenCalled();
    });
  });

  it('handles item group with children', () => {
    const items = [
      {
        type: 'itemGroup',
        title: 'Group',
        key: 'group-0',
        children: [{ type: 'item', title: 'Item 1' }],
      },
      {
        type: 'itemGroup',
        title: () => <div>123</div>,
        children: [{ type: 'item', title: 'Item 1' }],
      },
      {
        type: 'itemGroup',
        title: 'Group3',
      },
    ];
    const { result } = renderHook(() => useGetSchemaInitializerMenuItems());
    act(() => {
      const menuItems = result.current(items, 'parent');
      expect(menuItems).toMatchInlineSnapshot(`
        [
          {
            "children": [
              {
                "key": "group-0-Item 1-0",
                "label": "Item 1",
                "onClick": [Function],
                "style": undefined,
              },
            ],
            "key": "group-0",
            "label": "Group",
            "type": "group",
          },
          {
            "children": [
              {
                "key": "parent-item-group-1-Item 1-0",
                "label": "Item 1",
                "onClick": [Function],
                "style": undefined,
              },
            ],
            "key": "parent-item-group-1",
            "label": [Function],
            "type": "group",
          },
          {
            "children": [],
            "key": "parent-item-group-2",
            "label": "Group3",
            "type": "group",
          },
        ]
      `);
    });
  });

  it('handles subMenu with compiled title and children', () => {
    const items = [
      {
        type: 'subMenu',
        title: 'SubMenu1',
        name: 'submenu-1',
        children: [{ type: 'item', title: 'SubItem 1' }],
      },
      {
        type: 'subMenu',
        title: 'SubMenu2',
        name: 'submenu-2',
        children: [{ type: 'item', title: 'SubItem 1' }],
      },
      {
        type: 'subMenu',
        title: 'SubMenu3',
        key: 'submenu-3',
        children: [{ type: 'item', title: 'SubItem 1' }],
      },
      {
        type: 'subMenu',
        title: 'SubMenu4',
      },
    ];
    const { result } = renderHook(() => useGetSchemaInitializerMenuItems());
    act(() => {
      const menuItems = result.current(items, 'parent');
      expect(menuItems).toMatchInlineSnapshot(`
        [
          {
            "children": [
              {
                "key": "submenu-1-SubItem 1-0",
                "label": "SubItem 1",
                "onClick": [Function],
                "style": undefined,
              },
            ],
            "key": "submenu-1",
            "label": "SubMenu1",
          },
          {
            "children": [
              {
                "key": "submenu-2-SubItem 1-0",
                "label": "SubItem 1",
                "onClick": [Function],
                "style": undefined,
              },
            ],
            "key": "submenu-2",
            "label": "SubMenu2",
          },
          {
            "children": [
              {
                "key": "submenu-3-SubItem 1-0",
                "label": "SubItem 1",
                "onClick": [Function],
                "style": undefined,
              },
            ],
            "key": "submenu-3",
            "label": "SubMenu3",
          },
          {
            "children": [],
            "key": "parent-sub-menu-3",
            "label": "SubMenu4",
          },
        ]
      `);
    });
  });

  it('processes items with isMenuType property and excludes it in the return', () => {
    const items = [{ isMenuType: true, type: 'item', title: 'Special Item', key: 'special-0' }];
    const { result } = renderHook(() => useGetSchemaInitializerMenuItems(mockOnClick));
    act(() => {
      const menuItems = result.current(items, 'parent');
      expect(menuItems).toEqual([
        {
          type: 'item',
          title: 'Special Item',
          key: 'special-0',
        },
      ]);
    });
  });

  it('returns items with associationField', () => {
    const items = [{ type: 'item', title: 'Item w/ Association', associationField: 'field-1' }];
    const { result } = renderHook(() => useGetSchemaInitializerMenuItems(mockOnClick));
    act(() => {
      const menuItems = result.current(items, 'parent');
      expect(menuItems[0]).toHaveProperty('associationField', 'field-1');
    });
  });
});

describe('useSchemaInitializerMenuItems', () => {
  const items = [
    {
      type: 'item',
      key: 1,
      label: 'item1',
      onClick: vitest.fn(),
    },
    {
      type: 'item',
      key: 2,
      label: 'item2',
    },
  ];
  it('should call useGetSchemaInitializerMenuItems with provided items and name', () => {
    const name = 'TestName';
    const { result } = renderHook(() => useSchemaInitializerMenuItems(items, name));
    expect(result.current).toMatchInlineSnapshot(`
      [
        {
          "key": 1,
          "label": "item1",
          "onClick": [Function],
          "style": undefined,
        },
        {
          "key": 2,
          "label": "item2",
          "onClick": [Function],
          "style": undefined,
        },
      ]
    `);
  });

  it('should recompute getMenuItems when items or name changes', () => {
    const { rerender, result } = renderHook(({ items, name }) => useSchemaInitializerMenuItems(items, name), {
      initialProps: { items, name: 'InitialName' },
    });
    const res1 = result.current;
    rerender({ items, name: 'NewName' });
    const res2 = result.current;

    expect(res1).not.toEqual(res2);
  });

  it('should handle onClick event properly', () => {
    const mockOnClick = vitest.fn();
    const name = 'TestName';

    renderHook(() => useSchemaInitializerMenuItems(items, name, mockOnClick));
    expect(mockOnClick).not.toHaveBeenCalled();

    act(() => {
      items[0].onClick();
      items[0].onClick({ domEvent: { stopPropagation: vitest.fn() }, key: items[0].key });

      expect(items[0].onClick).toHaveBeenCalled();
      expect(mockOnClick).not.toHaveBeenCalled();
    });
  });
});
