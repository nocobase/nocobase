/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AssignedFieldsEditor } from '../AssignedFieldsEditor';

const { mockFlowEngine, mockFlowModelRenderer, workflowMetaTree } = vi.hoisted(() => {
  const workflowMetaTree = [{ name: 'workflow', paths: ['$jobsMapByNodeKey'] }];

  function createEmitter() {
    const listeners: Record<string, Array<(...args: unknown[]) => void>> = {};
    return {
      on: vi.fn((event: string, callback: (...args: unknown[]) => void) => {
        listeners[event] ||= [];
        listeners[event].push(callback);
      }),
      off: vi.fn((event: string, callback: (...args: unknown[]) => void) => {
        listeners[event] = (listeners[event] || []).filter((listener) => listener !== callback);
      }),
      emit: (event: string, ...args: unknown[]) => {
        (listeners[event] || []).forEach((listener) => listener(...args));
      },
    };
  }

  const createModel = vi.fn((options) => {
    let assignedValues: Record<string, unknown> = {};
    const model = {
      options,
      context: {
        defineMethod: vi.fn(),
      },
      emitter: createEmitter(),
      subModels: {
        grid: {
          context: {
            defineMethod: vi.fn(),
          },
          emitter: createEmitter(),
          subModels: {
            items: [],
          },
          remove: vi.fn(),
        },
      },
      setInitialAssignedValues: vi.fn((values: Record<string, unknown>) => {
        assignedValues = values;
      }),
      getAssignedValues: vi.fn(() => assignedValues),
      setAssignedValues(values: Record<string, unknown>) {
        assignedValues = values;
      },
      remove: vi.fn(),
    };
    return model;
  });

  return {
    workflowMetaTree,
    mockFlowEngine: {
      createModel,
    },
    mockFlowModelRenderer: vi.fn(({ model }) => (
      <button
        type="button"
        onClick={() => {
          const item = { context: { defineMethod: vi.fn() } };
          model.subModels.grid.subModels.items.push(item);
          model.setAssignedValues({ dateOnly: null, title: undefined });
          model.subModels.grid.emitter.emit('onSubModelAdded', item);
        }}
      >
        assign form
      </button>
    )),
  };
});

vi.mock('@nocobase/flow-engine', async () => {
  const actual = await vi.importActual<typeof import('@nocobase/flow-engine')>('@nocobase/flow-engine');
  return {
    ...actual,
    FlowModelRenderer: mockFlowModelRenderer,
    useFlowEngine: () => mockFlowEngine,
  };
});

vi.mock('../../../canvas/useWorkflowVariableOptions', () => ({
  useWorkflowVariableOptions: () => workflowMetaTree,
}));

vi.mock('../../../locale', () => ({
  useT: () => (key: string) => key,
}));

describe('AssignedFieldsEditor', () => {
  it('renders the v2 assign form model and syncs assigned values back to the workflow config form', async () => {
    const onChange = vi.fn();

    render(<AssignedFieldsEditor collection="posts" value={{ dateOnly: null }} onChange={onChange} />);

    await waitFor(() => {
      expect(mockFlowModelRenderer).toHaveBeenCalled();
    });

    expect(mockFlowEngine.createModel).toHaveBeenCalledWith({
      use: 'AssignFormModel',
      stepParams: {
        resourceSettings: {
          init: {
            dataSourceKey: 'main',
            collectionName: 'posts',
          },
        },
      },
      subModels: {
        grid: {
          use: 'AssignFormGridModel',
        },
      },
    });

    const model = mockFlowEngine.createModel.mock.results[0].value;
    expect(model.context.defineMethod).toHaveBeenCalledWith('getPropertyMetaTree', expect.any(Function));
    expect(model.context.defineMethod.mock.calls[0][1]()).toBe(workflowMetaTree);
    expect(model.subModels.grid.context.defineMethod).toHaveBeenCalledWith('getPropertyMetaTree', expect.any(Function));
    expect(model.subModels.grid.context.defineMethod.mock.calls[0][1]()).toBe(workflowMetaTree);

    fireEvent.click(screen.getByRole('button', { name: 'assign form' }));
    const item = model.subModels.grid.subModels.items[0];
    expect(item.context.defineMethod).toHaveBeenCalledWith('getPropertyMetaTree', expect.any(Function));
    expect(item.context.defineMethod.mock.calls[0][1]()).toBe(workflowMetaTree);
    expect(onChange).toHaveBeenCalledWith({ dateOnly: null, title: null });
  });
});
