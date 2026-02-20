/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { act, render, screen, userEvent, waitFor } from '@nocobase/test/client';
import { vi, beforeEach } from 'vitest';
import {
  AddSubModelButton,
  FlowEngine,
  FlowEngineProvider,
  FlowModel,
  FlowModelContext,
  type IFlowModelRepository,
} from '@nocobase/flow-engine';
import { SubModelItem, mergeSubModelItems, transformItems } from '../AddSubModelButton';
import { App, ConfigProvider } from 'antd';

describe('AddSubModelButton - preset settings open on add', () => {
  test('calls openFlowSettings with preset=true for subModel with preset steps', async () => {
    // Arrange: set up engine and models
    const engine = new FlowEngine();
    engine.flowSettings.forceEnable();

    class ParentModel extends FlowModel {}

    const openSpy = vi.fn().mockResolvedValue(true);
    class ChildModel extends FlowModel {
      // Register a flow with a preset step and simple uiSchema
      static registerLocalFlows() {
        this.registerFlow({
          key: 'settings',
          title: 'Settings Example',
          steps: {
            quick: {
              title: 'Quick Setup',
              preset: true,
              uiSchema: {
                field: { type: 'string', title: 'Title', 'x-decorator': 'FormItem', 'x-component': 'Input' },
              },
            },
          },
        });
      }

      // Override to avoid real UI and capture calls
      async openFlowSettings(options?: { preset?: boolean }) {
        openSpy(options);
        return true;
      }
    }

    // Register models and create a parent instance
    ChildModel.registerLocalFlows();
    engine.registerModels({ ParentModel, ChildModel });
    const parent = engine.createModel<ParentModel>({ use: 'ParentModel', uid: 'parent' });

    // Render AddSubModelButton inside providers so LazyDropdown works
    render(
      <FlowEngineProvider engine={engine}>
        <ConfigProvider>
          <App>
            <AddSubModelButton
              model={parent}
              subModelKey="items"
              items={[
                {
                  key: 'child',
                  label: 'Add Child',
                  createModelOptions: { use: 'ChildModel' },
                },
              ]}
            >
              Add SubModel
            </AddSubModelButton>
          </App>
        </ConfigProvider>
      </FlowEngineProvider>,
    );

    // Act: open dropdown and click the add item
    await act(async () => {
      await userEvent.click(screen.getByText('Add SubModel'));
    });

    // Ensure menu item appears, then click it
    await waitFor(() => expect(screen.getByText('Add Child')).toBeInTheDocument());
    await act(async () => {
      await userEvent.click(screen.getByText('Add Child'));
    });

    await waitFor(() => expect(openSpy).toHaveBeenCalled());
    expect(openSpy).toHaveBeenCalledWith(expect.objectContaining({ preset: true }));
  });
});

describe('AddSubModelButton - async group children (nested)', () => {
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  it('renders group and nested async group leaf items', async () => {
    const engine = new FlowEngine();
    engine.flowSettings.forceEnable();
    class Parent extends FlowModel {}
    engine.registerModels({ Parent });
    const parent = engine.createModel<FlowModel>({ use: 'Parent', uid: 'p1' });

    const items = async () => [
      {
        key: 'async-group',
        label: 'Async Group',
        type: 'group' as const,
        searchable: true,
        children: async () => {
          await sleep(30);
          return [
            { key: 'g-leaf-1', label: 'G-Leaf-1', createModelOptions: { use: 'Parent' } },
            {
              key: 'nested-group',
              label: 'Nested Group',
              type: 'group' as const,
              children: async () => {
                await sleep(30);
                return [
                  { key: 'nested-leaf-1', label: 'Nested-Leaf-1', createModelOptions: { use: 'Parent' } },
                  { key: 'nested-leaf-2', label: 'Nested-Leaf-2', createModelOptions: { use: 'Parent' } },
                ];
              },
            },
          ];
        },
      },
    ];

    render(
      <FlowEngineProvider engine={engine}>
        <ConfigProvider>
          <App>
            <AddSubModelButton model={parent} subModelKey="items" items={items as any}>
              Open Menu
            </AddSubModelButton>
          </App>
        </ConfigProvider>
      </FlowEngineProvider>,
    );

    await act(async () => {
      await userEvent.click(screen.getByText('Open Menu'));
    });

    await waitFor(() => expect(screen.getByText('Async Group')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('G-Leaf-1')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('Nested-Leaf-1')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('Nested-Leaf-2')).toBeInTheDocument());
  });
});

describe('transformItems - searchable flags', () => {
  it('preserves searchable + placeholder on non-group submenu items', async () => {
    const engine = new FlowEngine();
    engine.flowSettings.forceEnable();
    class Parent extends FlowModel {}
    engine.registerModels({ Parent });
    const parent = engine.createModel<FlowModel>({ use: 'Parent' });

    const items = [
      {
        key: 'submenu',
        label: 'Pick',
        searchable: true,
        searchPlaceholder: 'Search blocks',
        children: [
          { key: 'a', label: 'Alpha', createModelOptions: { use: 'Parent' } },
          { key: 'b', label: 'Beta', createModelOptions: { use: 'Parent' } },
        ],
      },
    ];

    const factory = transformItems(items as any, parent, 'items', 'array');
    const resolved = await (typeof factory === 'function' ? factory() : factory);
    expect(resolved).toHaveLength(1);
    const submenu = resolved[0] as any;
    expect(submenu.searchable).toBe(true);
    expect(submenu.searchPlaceholder).toBe('Search blocks');
    expect(Array.isArray(submenu.children)).toBe(true);
  });
});

describe('transformItems - hide', () => {
  it('filters items by hide flag/function recursively', async () => {
    const engine = new FlowEngine();
    engine.flowSettings.forceEnable();
    class Parent extends FlowModel {}
    engine.registerModels({ Parent });
    const parent = engine.createModel<FlowModel>({ use: 'Parent', uid: 'p-hide' });

    const definition: SubModelItem[] = [
      {
        key: 'keep',
        label: 'Keep',
        createModelOptions: { use: 'Parent' },
      },
      {
        key: 'hide-true',
        label: 'Hidden',
        hide: true,
        createModelOptions: { use: 'Parent' },
      },
      {
        key: 'hide-fn',
        label: 'HiddenFn',
        hide: (ctx: FlowModelContext) => ctx.model.uid === 'p-hide',
        createModelOptions: { use: 'Parent' },
      },
      {
        key: 'group',
        type: 'group',
        label: 'Group',
        children: [
          { key: 'g-hide', label: 'GHide', hide: true, createModelOptions: { use: 'Parent' } },
          { key: 'g-keep', label: 'GKeep', createModelOptions: { use: 'Parent' } },
        ],
      },
    ];

    const factory = transformItems(definition, parent, 'items', 'array');
    const resolved = await (typeof factory === 'function' ? factory() : factory);

    expect(resolved.map((i: any) => i.key)).toEqual(['keep', 'group']);
    const group = resolved.find((i: any) => i.key === 'group') as any;
    expect(group).toBeTruthy();
    expect(Array.isArray(group.children)).toBe(true);
    expect(group.children.map((i: any) => i.key)).toEqual(['g-keep']);
  });

  it('removes group when all children are hidden (even with async hide)', async () => {
    const engine = new FlowEngine();
    engine.flowSettings.forceEnable();
    class Parent extends FlowModel {}
    engine.registerModels({ Parent });
    const parent = engine.createModel<FlowModel>({ use: 'Parent', uid: 'p-empty-group' });

    let show = false;
    const definition: SubModelItem[] = [
      {
        key: 'group',
        type: 'group',
        label: 'Group',
        children: [
          {
            key: 'child',
            label: 'Child',
            hide: async () => !show,
            createModelOptions: { use: 'Parent' },
          },
        ],
      },
    ];

    const factory = transformItems(definition, parent, 'items', 'array');
    const first = await (factory as () => Promise<any[]>)();
    expect(first).toHaveLength(0);

    show = true;
    const second = await (factory as () => Promise<any[]>)();
    expect(second.map((i: any) => i.key)).toEqual(['group']);
  });

  it('supports async hide functions and disables cache', async () => {
    const engine = new FlowEngine();
    engine.flowSettings.forceEnable();
    class Parent extends FlowModel {}
    engine.registerModels({ Parent });
    const parent = engine.createModel<FlowModel>({ use: 'Parent', uid: 'p-async-hide' });

    let shouldHide = true;
    const definition: SubModelItem[] = [
      {
        key: 'async-hide',
        label: 'AsyncHide',
        hide: async () => shouldHide,
        createModelOptions: { use: 'Parent' },
      },
    ];

    const factory = transformItems(definition, parent, 'items', 'array');

    const first = await (factory as () => Promise<any[]>)();
    expect(first).toHaveLength(0);

    shouldHide = false;
    const second = await (factory as () => Promise<any[]>)();
    expect(second.map((i: any) => i.key)).toEqual(['async-hide']);
    expect(second).not.toBe(first);
  });

  it('shows items when hide function throws (conservative fallback)', async () => {
    const engine = new FlowEngine();
    engine.flowSettings.forceEnable();
    class Parent extends FlowModel {}
    engine.registerModels({ Parent });
    const parent = engine.createModel<FlowModel>({ use: 'Parent', uid: 'p-hide-throws' });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const definition: SubModelItem[] = [
        {
          key: 'throw',
          label: 'Throw',
          hide: async () => {
            throw new Error('boom');
          },
          createModelOptions: { use: 'Parent' },
        },
      ];

      const factory = transformItems(definition, parent, 'items', 'array');
      const resolved = await (factory as () => Promise<any[]>)();
      expect(resolved.map((i: any) => i.key)).toEqual(['throw']);
    } finally {
      consoleSpy.mockRestore();
    }
  });
});

describe('transformItems - toggleable items', () => {
  class ToggleParent extends FlowModel {}
  class ToggleChild extends FlowModel {}

  const setupEngine = () => {
    const engine = new FlowEngine();
    engine.flowSettings.forceEnable();
    engine.registerModels({ ToggleParent, ToggleChild });
    return engine;
  };

  it('marks toggleable item as active when matching sub model exists', async () => {
    const engine = setupEngine();
    const parent = engine.createModel<ToggleParent>({ use: 'ToggleParent', uid: 'toggle-parent-on' });
    const child = engine.createModel<ToggleChild>({ use: 'ToggleChild', uid: 'toggle-child-on' });
    parent.addSubModel('items', child);

    const definition: SubModelItem[] = [
      {
        key: 'toggle-child',
        label: 'Toggle Child',
        toggleable: true,
        useModel: 'ToggleChild',
        createModelOptions: { use: 'ToggleChild' },
      },
    ];

    const factory = transformItems(definition, parent, 'items', 'array');
    const resolved = await (typeof factory === 'function' ? factory() : Promise.resolve(factory));
    const toggleItem = resolved[0];

    expect(toggleItem.isToggled).toBe(true);
    expect(toggleItem.keepDropdownOpen).toBe(true);
    expect(typeof definition[0].customRemove).toBe('function');

    const { getByRole } = render(<>{toggleItem.label}</>);
    expect(getByRole('switch')).toHaveAttribute('aria-checked', 'true');

    // customRemove 应当能销毁已存在的子模型
    await definition[0].customRemove?.(parent.context, definition[0]);
    expect(((parent.subModels as any).items || []).length).toBe(0);
  });

  it('infers useModel from createModelOptions when toggleable is enabled', async () => {
    const engine = setupEngine();
    const parent = engine.createModel<ToggleParent>({ use: 'ToggleParent', uid: 'toggle-parent-infer' });
    const child = engine.createModel<ToggleChild>({ use: 'ToggleChild', uid: 'toggle-child-infer' });
    parent.addSubModel('items', child);

    const definition: SubModelItem[] = [
      {
        key: 'toggle-child',
        label: 'Toggle Child',
        toggleable: true,
        // intentionally omit useModel to rely on createModelOptions.use
        createModelOptions: { use: 'ToggleChild' },
      },
    ];

    const factory = transformItems(definition, parent, 'items', 'array');
    const resolved = await (typeof factory === 'function' ? factory() : Promise.resolve(factory));
    const toggleItem = resolved[0];

    expect(definition[0].useModel).toBe('ToggleChild');
    expect(toggleItem.isToggled).toBe(true);
    const { getByRole } = render(<>{toggleItem.label}</>);
    expect(getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('keeps toggleable item off when sub model missing', async () => {
    const engine = setupEngine();
    const parent = engine.createModel<ToggleParent>({ use: 'ToggleParent', uid: 'toggle-parent-off' });

    const definition: SubModelItem[] = [
      {
        key: 'toggle-child',
        label: 'Toggle Child',
        toggleable: true,
        useModel: 'ToggleChild',
        createModelOptions: { use: 'ToggleChild' },
      },
    ];

    const factory = transformItems(definition, parent, 'items', 'array');
    const resolved = await (typeof factory === 'function' ? factory() : Promise.resolve(factory));
    const toggleItem = resolved[0];

    expect(toggleItem.isToggled).toBe(false);
    const { getByRole } = render(<>{toggleItem.label}</>);
    expect(getByRole('switch')).toHaveAttribute('aria-checked', 'false');
  });

  it('respects keepDropdownOpen override on toggleable items', async () => {
    const engine = setupEngine();
    const parent = engine.createModel<ToggleParent>({ use: 'ToggleParent', uid: 'toggle-parent-keep' });

    const definition: SubModelItem[] = [
      {
        key: 'toggle-child-keep',
        label: 'Toggle Child Keep',
        toggleable: true,
        useModel: 'ToggleChild',
        keepDropdownOpen: false,
        createModelOptions: { use: 'ToggleChild' },
      },
    ];

    const factory = transformItems(definition, parent, 'items', 'array');
    const resolved = await (factory as () => Promise<any[]>)();
    const toggleItem = resolved[0];

    expect(toggleItem.keepDropdownOpen).toBe(false);
  });

  it('removes object sub model via default remove handler when toggleDetector provided', async () => {
    const engine = new FlowEngine();
    engine.flowSettings.forceEnable();

    class ObjectParent extends FlowModel {}
    class ObjectChild extends FlowModel {}

    engine.registerModels({ ObjectParent, ObjectChild });
    const parent = engine.createModel<ObjectParent>({ use: 'ObjectParent', uid: 'object-parent' });
    const child = engine.createModel<ObjectChild>({ use: 'ObjectChild', uid: 'object-child' });
    parent.setSubModel('single', child);

    const afterSubModelRemove = vi.fn();

    render(
      <FlowEngineProvider engine={engine}>
        <ConfigProvider>
          <App>
            <AddSubModelButton
              model={parent}
              subModelKey="single"
              subModelType="object"
              items={[
                {
                  key: 'toggle-object',
                  label: 'Toggle Object',
                  toggleDetector: async (ctx) => Boolean((ctx.model.subModels as any).single),
                  createModelOptions: { use: 'ObjectChild' },
                  keepDropdownOpen: false,
                },
              ]}
              afterSubModelRemove={afterSubModelRemove}
            >
              Toggle Menu
            </AddSubModelButton>
          </App>
        </ConfigProvider>
      </FlowEngineProvider>,
    );

    await act(async () => {
      await userEvent.click(screen.getByText('Toggle Menu'));
    });

    await waitFor(() => expect(screen.getByText('Toggle Object')).toBeInTheDocument());
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');

    await act(async () => {
      await userEvent.click(screen.getByText('Toggle Object'));
    });

    await waitFor(() =>
      expect(afterSubModelRemove).toHaveBeenCalledWith(expect.objectContaining({ uid: 'object-child' })),
    );
    await waitFor(() => expect((parent.subModels as any).single).toBeUndefined());
  });
});

describe('mergeSubModelItems', () => {
  it('merges multiple sources with divider insertion', async () => {
    const staticItems: SubModelItem[] = [{ key: 'static', label: 'Static' }];
    const asyncItems = async () => [{ key: 'async', label: 'Async' }];

    const merged = mergeSubModelItems([staticItems, null, asyncItems], { addDividers: true });
    expect(typeof merged).toBe('function');

    const ctx = {} as FlowModelContext;
    const result = await (merged as (ctx: FlowModelContext) => Promise<SubModelItem[]>)(ctx);

    expect(result.map((item) => item.key)).toEqual(['static', 'divider-1', 'async']);
    expect(result[1]).toMatchObject({ type: 'divider' });
  });
});

describe('transformItems - caching behaviour', () => {
  class CacheParent extends FlowModel {}
  class CacheChild extends FlowModel {}

  const setupEngine = () => {
    const engine = new FlowEngine();
    engine.flowSettings.forceEnable();
    engine.registerModels({ CacheParent, CacheChild });
    const parent = engine.createModel<CacheParent>({ use: 'CacheParent', uid: 'cache-parent' });
    return { engine, parent };
  };

  it('reuses cached result when no toggleable items exist', async () => {
    const { parent } = setupEngine();
    const definition: SubModelItem[] = [{ key: 'basic', label: 'Basic', createModelOptions: { use: 'CacheChild' } }];

    const factory = transformItems(definition, parent, 'items', 'array');
    expect(typeof factory).toBe('function');

    const first = await (factory as () => Promise<any[]>)();
    const second = await (factory as () => Promise<any[]>)();

    expect(second).toBe(first);
  });

  it('refreshes toggle state after new sub model is added', async () => {
    const { parent, engine } = setupEngine();
    const createDefinition = (): SubModelItem[] => [
      {
        key: 'toggleable',
        label: 'Toggleable',
        toggleable: true,
        useModel: 'CacheChild',
        createModelOptions: { use: 'CacheChild' },
      },
    ];

    const firstFactory = transformItems(createDefinition(), parent, 'items', 'array');
    expect(typeof firstFactory).toBe('function');
    const before = await (firstFactory as () => Promise<any[]>)();
    expect(before[0].isToggled).toBe(false);

    const child = engine.createModel<CacheChild>({ use: 'CacheChild', uid: 'cache-child' });
    parent.addSubModel('items', child);

    const secondFactory = transformItems(createDefinition(), parent, 'items', 'array');
    expect(typeof secondFactory).toBe('function');
    const after = await (secondFactory as () => Promise<any[]>)();
    expect(after[0].isToggled).toBe(true);
  });
});

describe('AddSubModelButton - refreshTargets linkage', () => {
  it('clicking an item with refreshTargets triggers toggle recomputation on target branch', async () => {
    const engine = new FlowEngine();
    engine.flowSettings.forceEnable();

    class Parent extends FlowModel {}
    class ToggleModel extends FlowModel {}

    engine.registerModels({ Parent, ToggleModel });
    const parent = engine.createModel<Parent>({ use: 'Parent', uid: 'p-refreshTargets' });

    const items = [
      {
        key: 'js',
        label: 'JS Group',
        type: 'group' as const,
        children: [
          {
            key: 'add-toggle',
            label: 'Add Toggle',
            refreshTargets: ['top'],
            createModelOptions: { use: 'ToggleModel' },
          },
        ],
      },
      {
        key: 'top',
        label: 'Top Group',
        type: 'group' as const,
        children: [
          {
            key: 'top-toggle',
            label: 'Top Toggle',
            toggleable: true,
            useModel: 'ToggleModel',
            createModelOptions: { use: 'ToggleModel' },
          },
        ],
      },
    ];

    render(
      <FlowEngineProvider engine={engine}>
        <ConfigProvider>
          <App>
            <AddSubModelButton model={parent} subModelKey="subs" items={items as any} keepDropdownOpen>
              Open
            </AddSubModelButton>
          </App>
        </ConfigProvider>
      </FlowEngineProvider>,
    );

    const user = userEvent.setup();
    await act(async () => {
      await user.click(screen.getByText('Open'));
    });

    await waitFor(() => expect(screen.getByText('JS Group')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('Add Toggle')).toBeInTheDocument());
    await act(async () => {
      await user.click(screen.getByText('Add Toggle'));
    });

    await waitFor(() => expect(screen.getByText('Top Group')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('Top Toggle')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true'));
  });
});

describe('AddSubModelButton - base class menu groups', () => {
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  it('renders async children provided by subModelBaseClasses', async () => {
    const engine = new FlowEngine();
    engine.flowSettings.forceEnable();

    class Parent extends FlowModel {}
    class AsyncLeaf extends FlowModel {}
    class AsyncGroup extends FlowModel {
      static meta = {
        label: 'Async Group',
        children: async () => {
          await sleep(20);
          return [
            {
              key: 'async-leaf',
              label: 'Async Leaf',
              createModelOptions: { use: 'AsyncLeaf' },
            },
          ];
        },
      };
    }

    engine.registerModels({ Parent, AsyncGroup, AsyncLeaf });
    const parent = engine.createModel<Parent>({ use: 'Parent', uid: 'parent-async-group' });

    render(
      <FlowEngineProvider engine={engine}>
        <ConfigProvider>
          <App>
            <AddSubModelButton model={parent} subModelKey="items" subModelBaseClasses={['AsyncGroup']}>
              Add Item
            </AddSubModelButton>
          </App>
        </ConfigProvider>
      </FlowEngineProvider>,
    );

    await act(async () => {
      await userEvent.click(screen.getByText('Add Item'));
    });

    await waitFor(() => expect(screen.getByText('Async Group')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('Async Leaf')).toBeInTheDocument());
  });

  it('skips base class groups whose children resolve to empty', async () => {
    const engine = new FlowEngine();
    engine.flowSettings.forceEnable();

    class Parent extends FlowModel {}
    class EmptyLeaf extends FlowModel {}
    class EmptyGroup extends FlowModel {
      static meta = {
        label: 'Empty Group',
        children: async () => {
          await sleep(10);
          return [];
        },
      };
    }
    class NonEmptyGroup extends FlowModel {
      static meta = {
        label: 'Available Group',
        children: async () => [
          {
            key: 'available-leaf',
            label: 'Available Leaf',
            createModelOptions: { use: 'EmptyLeaf' },
          },
        ],
      };
    }

    engine.registerModels({ Parent, EmptyGroup, NonEmptyGroup, EmptyLeaf });
    const parent = engine.createModel<Parent>({ use: 'Parent', uid: 'parent-empty-group' });

    render(
      <FlowEngineProvider engine={engine}>
        <ConfigProvider>
          <App>
            <AddSubModelButton model={parent} subModelKey="items" subModelBaseClasses={['EmptyGroup', 'NonEmptyGroup']}>
              Open Menu
            </AddSubModelButton>
          </App>
        </ConfigProvider>
      </FlowEngineProvider>,
    );

    await act(async () => {
      await userEvent.click(screen.getByText('Open Menu'));
    });

    await waitFor(() => expect(screen.getByText('Available Group')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('Available Leaf')).toBeInTheDocument());
    expect(screen.queryByText('Empty Group')).toBeNull();
  });

  it('renders submenu base class with children and respects meta.sort', async () => {
    const engine = new FlowEngine();
    engine.flowSettings.forceEnable();

    class Parent extends FlowModel {}
    class Leaf extends FlowModel {}
    class SubmenuBase extends FlowModel {
      static meta = {
        label: 'JS Field',
        menuType: 'submenu' as const,
        sort: 110,
        children: () => [{ key: 'submenu-leaf', label: 'Submenu Leaf', createModelOptions: { use: 'Leaf' } }],
      };
    }
    class GroupBase extends FlowModel {
      static meta = {
        label: 'Group Base',
        sort: 200,
        children: () => [{ key: 'group-leaf', label: 'Group Leaf', createModelOptions: { use: 'Leaf' } }],
      };
    }

    engine.registerModels({ Parent, Leaf, SubmenuBase, GroupBase });
    const parent = engine.createModel<Parent>({ use: 'Parent', uid: 'parent-submenu' });

    render(
      <FlowEngineProvider engine={engine}>
        <ConfigProvider>
          <App>
            <AddSubModelButton
              model={parent}
              subModelKey="items"
              subModelBaseClasses={[
                // reversed on purpose; order should be controlled by meta.sort
                'GroupBase',
                'SubmenuBase',
              ]}
            >
              Open Menu
            </AddSubModelButton>
          </App>
        </ConfigProvider>
      </FlowEngineProvider>,
    );

    await act(async () => {
      await userEvent.click(screen.getByText('Open Menu'));
    });

    // Both base entries should be visible
    const submenu = await screen.findByText('JS Field');
    const group = await screen.findByText('Group Base');
    expect(submenu).toBeInTheDocument();
    expect(group).toBeInTheDocument();

    // submenu should appear before group due to sort: 110 < 200
    const pos = submenu.compareDocumentPosition(group);
    expect(pos & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    // Hover to open submenu children
    await userEvent.hover(submenu);
    await waitFor(() => expect(screen.getByText('Submenu Leaf')).toBeInTheDocument());
  });

  it('merges explicit items with base class and grouped sources', async () => {
    const engine = new FlowEngine();
    engine.flowSettings.forceEnable();

    class Parent extends FlowModel {}
    class BaseChild extends FlowModel {}
    BaseChild.define({ label: 'Base Child' });

    class GroupBase extends FlowModel {}
    GroupBase.define({
      label: 'Group Base',
      children: () => [
        {
          key: 'group-leaf',
          label: 'Group Leaf',
          createModelOptions: { use: 'Parent' },
        },
      ],
    });

    engine.registerModels({ Parent, BaseChild, GroupBase });
    const parent = engine.createModel<Parent>({ use: 'Parent', uid: 'parent-merged-sources' });

    render(
      <FlowEngineProvider engine={engine}>
        <ConfigProvider>
          <App>
            <AddSubModelButton
              model={parent}
              subModelKey="items"
              items={[
                {
                  key: 'custom-leaf',
                  label: 'Custom Leaf',
                  createModelOptions: { use: 'BaseChild' },
                },
              ]}
              subModelBaseClass="BaseChild"
              subModelBaseClasses={['GroupBase']}
            >
              Open Menu
            </AddSubModelButton>
          </App>
        </ConfigProvider>
      </FlowEngineProvider>,
    );

    await act(async () => {
      await userEvent.click(screen.getByText('Open Menu'));
    });

    await waitFor(() => expect(screen.getByText('Custom Leaf')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('Base Child')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('Group Base')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('Group Leaf')).toBeInTheDocument());
  });
});

describe('AddSubModelButton - toggle interactions', () => {
  it('removes existing toggleable sub model and triggers callbacks', async () => {
    const engine = new FlowEngine();
    engine.flowSettings.forceEnable();

    class ToggleParent extends FlowModel {}
    const destroySpy = vi.fn();
    class ToggleChild extends FlowModel {
      async destroy() {
        destroySpy();
        return super.destroy();
      }
    }

    engine.registerModels({ ToggleParent, ToggleChild });
    const parent = engine.createModel<ToggleParent>({ use: 'ToggleParent', uid: 'toggle-parent-remove' });
    const existing = engine.createModel<ToggleChild>({ use: 'ToggleChild', uid: 'toggle-child-existing' });
    parent.addSubModel('items', existing);

    const afterSubModelRemove = vi.fn();

    render(
      <FlowEngineProvider engine={engine}>
        <ConfigProvider>
          <App>
            <AddSubModelButton
              model={parent}
              subModelKey="items"
              items={[
                {
                  key: 'toggle-child',
                  label: 'Toggle Child',
                  toggleable: true,
                  useModel: 'ToggleChild',
                  createModelOptions: { use: 'ToggleChild' },
                },
              ]}
              afterSubModelRemove={afterSubModelRemove}
            >
              Toggle Menu
            </AddSubModelButton>
          </App>
        </ConfigProvider>
      </FlowEngineProvider>,
    );

    await act(async () => {
      await userEvent.click(screen.getByText('Toggle Menu'));
    });

    await waitFor(() => expect(screen.getByText('Toggle Child')).toBeInTheDocument());
    const switchControl = screen.getByRole('switch');
    expect(switchControl).toHaveAttribute('aria-checked', 'true');

    await act(async () => {
      await userEvent.click(screen.getByText('Toggle Child'));
    });

    await waitFor(() => expect(destroySpy).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(afterSubModelRemove).toHaveBeenCalledWith(expect.objectContaining({ uid: 'toggle-child-existing' })),
    );
    expect((((parent.subModels as any).items as FlowModel[]) || []).length).toBe(0);
  });

  it('creates toggleable sub model and runs lifecycle callbacks', async () => {
    const engine = new FlowEngine();
    engine.flowSettings.forceEnable();

    class ToggleParent extends FlowModel {}
    const saveSpy = vi.fn();
    class ToggleChild extends FlowModel {
      async openFlowSettings() {
        return false;
      }

      async afterAddAsSubModel() {
        return Promise.resolve();
      }

      async save() {
        saveSpy();
        return Promise.resolve();
      }
    }

    engine.registerModels({ ToggleParent, ToggleChild });
    const parent = engine.createModel<ToggleParent>({ use: 'ToggleParent', uid: 'toggle-parent-add' });

    const afterSubModelInit = vi.fn();
    const afterSubModelAdd = vi.fn();

    render(
      <FlowEngineProvider engine={engine}>
        <ConfigProvider>
          <App>
            <AddSubModelButton
              model={parent}
              subModelKey="items"
              items={[
                {
                  key: 'toggle-child',
                  label: 'Toggle Child',
                  toggleable: true,
                  useModel: 'ToggleChild',
                  createModelOptions: { use: 'ToggleChild' },
                },
              ]}
              afterSubModelInit={afterSubModelInit}
              afterSubModelAdd={afterSubModelAdd}
            >
              Toggle Menu
            </AddSubModelButton>
          </App>
        </ConfigProvider>
      </FlowEngineProvider>,
    );

    await act(async () => {
      await userEvent.click(screen.getByText('Toggle Menu'));
    });

    await waitFor(() => expect(screen.getByText('Toggle Child')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false'));

    await act(async () => {
      await userEvent.click(screen.getByText('Toggle Child'));
    });

    await waitFor(() => expect(afterSubModelInit).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(afterSubModelAdd).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(saveSpy).toHaveBeenCalledTimes(1));

    const subModels = ((parent.subModels as any).items as FlowModel[]) || [];
    expect(subModels).toHaveLength(1);
  });
});

// ========================
// Toggleable dropdown UX
// ========================
describe('AddSubModelButton toggleable behavior', () => {
  // A simple Toggle model used for toggleable menu items
  class ToggleModel extends FlowModel {}

  // Minimal fake repository for save/destroy
  class FakeRepo implements IFlowModelRepository<any> {
    findOne = vi.fn().mockResolvedValue(null);
    save = vi.fn().mockResolvedValue({});
    destroy = vi.fn().mockResolvedValue(true);
    move = vi.fn().mockResolvedValue(undefined);
    duplicate = vi.fn().mockResolvedValue(null);
  }

  function setup() {
    const engine = new FlowEngine();
    engine.flowSettings.forceEnable();
    engine.registerModels({ ToggleModel });
    engine.setModelRepository(new FakeRepo());

    // Avoid opening any settings UI; proceed directly to add
    vi.spyOn(engine.flowSettings, 'open').mockResolvedValue(false as any);

    const parent = engine.createModel<FlowModel>({ use: FlowModel });

    // static array wrapped in a function to avoid caching pitfalls
    const items = async () => [
      {
        key: 'toggle',
        label: 'Toggle Feature',
        toggleable: true,
        useModel: 'ToggleModel',
        createModelOptions: { use: 'ToggleModel' },
      },
      {
        key: 'group',
        label: 'Async Group',
        type: 'group' as const,
        // async children to simulate heavy branch; should not be cleared on toggle refresh
        children: async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return [
            { key: 'child-a', label: 'Child A' },
            { key: 'child-b', label: 'Child B' },
          ];
        },
      },
    ];

    const ui = (
      <FlowEngineProvider engine={engine}>
        <ConfigProvider>
          <App>
            <AddSubModelButton model={parent} items={items as any} subModelType="array" subModelKey="subs">
              Open
            </AddSubModelButton>
          </App>
        </ConfigProvider>
      </FlowEngineProvider>
    );

    return { engine, parent, ui };
  }

  beforeEach(() => {
    vi.useRealTimers();
  });

  test('keeps dropdown open and preserves loaded children on toggle add/remove', async () => {
    const { engine, ui } = setup();
    const user = userEvent.setup();

    render(ui);

    // open menu
    await user.click(screen.getByText('Open'));

    // wait async group children to load
    await waitFor(() => expect(screen.getByText('Child A')).toBeInTheDocument());
    expect(screen.getByText('Child B')).toBeInTheDocument();

    const repo = engine.modelRepository as FakeRepo;

    // toggle ON (add model)
    await user.click(screen.getByText('Toggle Feature'));

    // Wait for save to be called after adding
    await waitFor(
      () => {
        expect(repo.save).toHaveBeenCalled();
      },
      { timeout: 3000 },
    );

    // dropdown should remain open and children should still be visible (no flicker / reload)
    expect(screen.getByText('Async Group')).toBeInTheDocument();
    expect(screen.getByText('Child A')).toBeInTheDocument();
    expect(screen.getByText('Child B')).toBeInTheDocument();

    // toggle OFF (remove model)
    await user.click(screen.getByText('Toggle Feature'));

    // still open and children preserved
    expect(screen.getByText('Async Group')).toBeInTheDocument();
    expect(screen.getByText('Child A')).toBeInTheDocument();
    expect(screen.getByText('Child B')).toBeInTheDocument();

    // ensure destroy has been called (avoid flakiness on exact call counts)
    await waitFor(() => {
      expect(repo.destroy).toHaveBeenCalled();
    });
  });

  test('toggle state updates without menu closing', async () => {
    const { ui } = setup();
    const user = userEvent.setup();

    render(ui);

    await user.click(screen.getByText('Open'));
    await waitFor(() => expect(screen.getByText('Toggle Feature')).toBeInTheDocument());

    // add => the switch label should change to toggled state on next paint
    await user.click(screen.getByText('Toggle Feature'));

    // menu remains visible
    expect(screen.getByText('Toggle Feature')).toBeInTheDocument();
    expect(screen.getByText('Async Group')).toBeInTheDocument();
  });

  test('nested submenu (static items) toggle keeps menu open and reflects state', async () => {
    const engine = new FlowEngine();
    engine.flowSettings.forceEnable();
    engine.registerModels({ ToggleModel });
    const parent = engine.createModel<FlowModel>({ use: FlowModel });

    const items = [
      {
        key: 'fields',
        label: 'Fields',
        searchable: true,
        // 非 group 子菜单（需要鼠标悬浮展开）
        children: [
          {
            key: 'f1',
            label: 'Field 1',
            // 基于 stepParams 的二级切换判定
            toggleable: (m: any) => m.getStepParams('fieldSettings', 'init')?.fieldPath === 'f1',
            useModel: 'ToggleModel',
            createModelOptions: {
              use: 'ToggleModel',
              stepParams: {
                fieldSettings: {
                  init: { fieldPath: 'f1' },
                },
              },
            },
          },
        ],
      },
    ];

    const user = userEvent.setup();
    render(
      <FlowEngineProvider engine={engine}>
        <ConfigProvider>
          <App>
            <AddSubModelButton model={parent} items={items as any} subModelKey="subs">
              Open
            </AddSubModelButton>
          </App>
        </ConfigProvider>
      </FlowEngineProvider>,
    );

    // 打开主菜单
    await user.click(screen.getByText('Open'));
    // 等待父级子菜单项渲染出来再悬浮展开
    await waitFor(() => expect(screen.getByText('Fields')).toBeInTheDocument());
    await user.hover(screen.getByText('Fields'));
    // 初始未选中
    await waitFor(() => expect(screen.getByText('Field 1')).toBeInTheDocument());
    const getSwitch = () => screen.getAllByRole('switch')[0];
    expect(getSwitch()).toHaveAttribute('aria-checked', 'false');

    // 点击以选中，菜单不应被关闭；仍可见 Fields 和 Field 1
    // 需要等待子菜单项动画结束，避免 pointer-events: none 导致点击失败
    const el = screen.getByText('Field 1');
    await waitFor(() => expect(window.getComputedStyle(el).pointerEvents).not.toBe('none'));
    await user.click(screen.getByText('Field 1'));
    await waitFor(() => {
      expect(screen.getByText('Fields')).toBeInTheDocument();
      expect(screen.getByText('Field 1')).toBeInTheDocument();
      expect(getSwitch()).toHaveAttribute('aria-checked', 'true');
    });

    // 再次点击以取消选中，菜单仍保持
    // 二级子菜单在点击后可能被 rc-menu 收起，需要先重新展开
    await user.hover(screen.getByText('Fields'));
    await waitFor(() => expect(screen.getByText('Field 1')).toBeInTheDocument());
    {
      const el = screen.getByText('Field 1');
      await waitFor(() => expect(window.getComputedStyle(el).pointerEvents).not.toBe('none'));
    }
    await user.click(screen.getByText('Field 1'));
    await waitFor(() => {
      expect(screen.getByText('Fields')).toBeInTheDocument();
      expect(screen.getByText('Field 1')).toBeInTheDocument();
      expect(getSwitch()).toHaveAttribute('aria-checked', 'false');
    });
  });

  test('submenu (second-level) toggleable stays open and updates state', async () => {
    const engine = new FlowEngine();
    engine.flowSettings.forceEnable();
    engine.registerModels({ ToggleModel });
    engine.setModelRepository(new FakeRepo());
    vi.spyOn(engine.flowSettings, 'open').mockResolvedValue(false as any);

    const parent = engine.createModel<FlowModel>({ use: FlowModel });

    const items = [
      {
        key: 'submenu',
        label: 'Fields',
        // create a real submenu (non-group) with static children
        children: [
          {
            key: 'leaf-toggle',
            label: 'Leaf Toggle',
            toggleable: true,
            useModel: 'ToggleModel',
            createModelOptions: { use: 'ToggleModel' },
          },
        ],
      },
    ];

    render(
      <FlowEngineProvider engine={engine}>
        <ConfigProvider>
          <App>
            <AddSubModelButton model={parent} items={items as any} subModelType="array" subModelKey="subs">
              Open
            </AddSubModelButton>
          </App>
        </ConfigProvider>
      </FlowEngineProvider>,
    );

    const user = userEvent.setup();
    await user.click(screen.getByText('Open'));

    // hover to open submenu
    // Using click on parent also works in test environment to render children
    await waitFor(() => expect(screen.getByText('Fields')).toBeInTheDocument());
    await user.hover(screen.getByText('Fields'));
    await waitFor(() => expect(screen.getByText('Leaf Toggle')).toBeInTheDocument());

    // click leaf toggle to add
    await user.click(screen.getByText('Leaf Toggle'));

    // menu should remain visible; submenu parent still visible
    expect(screen.getByText('Fields')).toBeInTheDocument();

    // 由于点击叶子项后二级子菜单可能被收起，这里先重新展开再断言开关状态
    await user.hover(screen.getByText('Fields'));
    await waitFor(() => expect(screen.getByText('Leaf Toggle')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true'));
  });

  test('top-level toggle updates after opening a second-level branch', async () => {
    const engine = new FlowEngine();
    engine.flowSettings.forceEnable();
    engine.registerModels({ ToggleModel });
    engine.setModelRepository(new FakeRepo());
    vi.spyOn(engine.flowSettings, 'open').mockResolvedValue(false as any);

    const parent = engine.createModel<FlowModel>({ use: FlowModel });

    const items = async () => [
      {
        key: 'fields',
        label: 'Fields',
        type: 'group' as const,
        // static children (simulate TableColumnModel fields) – must still update after refresh
        children: [
          {
            key: 'id',
            label: 'ID',
            toggleable: true,
            useModel: 'ToggleModel',
            createModelOptions: { use: 'ToggleModel' },
          },
        ],
      },
      {
        key: 'associations',
        label: 'Associations',
        type: 'group' as const,
        // async group to create a loadedChildren entry when opened
        children: async () => [
          {
            key: 'assoc-a',
            label: 'Assoc A',
            type: 'group' as const,
            children: [
              { key: 'child-a', label: 'Child A' },
              { key: 'child-b', label: 'Child B' },
            ],
          },
        ],
      },
    ];

    render(
      <FlowEngineProvider engine={engine}>
        <ConfigProvider>
          <App>
            <AddSubModelButton model={parent} items={items as any} subModelType="array" subModelKey="subs">
              Open
            </AddSubModelButton>
          </App>
        </ConfigProvider>
      </FlowEngineProvider>,
    );

    const user = userEvent.setup();
    await user.click(screen.getByText('Open'));

    // open a second-level branch (to simulate previously opened submenu)
    await waitFor(() => expect(screen.getByText('Associations')).toBeInTheDocument());
    await user.hover(screen.getByText('Associations'));
    await waitFor(() => expect(screen.getByText('Assoc A')).toBeInTheDocument());

    // click top-level item 'ID'
    await user.click(screen.getByText('ID'));

    // menu stays open and the switch for ID should be ON
    await waitFor(() => expect(screen.getByText('Fields')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('ID')).toBeInTheDocument());
    // there is only one switch in this minimal case; ensure it is ON
    await waitFor(() => expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true'));
  });
});
