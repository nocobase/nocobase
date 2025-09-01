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
