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
import { vi } from 'vitest';
import { AddSubModelButton, FlowEngine, FlowEngineProvider, FlowModel } from '@nocobase/flow-engine';
import { transformItems } from '../AddSubModelButton';
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
