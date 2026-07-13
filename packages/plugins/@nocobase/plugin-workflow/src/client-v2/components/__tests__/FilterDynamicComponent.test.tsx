/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { FlowEngine, FlowEngineProvider } from '@nocobase/flow-engine';
import { Form } from 'antd';
import { FilterDynamicComponent } from '../FilterDynamicComponent';

const testState = vi.hoisted(() => ({
  variableFilterItems: [] as any[],
}));

vi.mock('@nocobase/client-v2', async () => {
  const actual = await vi.importActual<any>('@nocobase/client-v2');
  const ReactModule = await vi.importActual<any>('react');
  const { useFlowContext } = await vi.importActual<any>('@nocobase/flow-engine');
  return {
    ...actual,
    VariableFilterItem: (props: any) => {
      const ctx = useFlowContext();
      testState.variableFilterItems.push({
        ...props,
        contextModel: ctx?.model,
      });
      return ReactModule.default.createElement('input', {
        'data-testid': 'variable-filter-item',
        'data-flow-model-translate': typeof ctx?.model?.translate,
        value: props.value.value ?? '',
        onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
          props.value.value = event.target.value;
        },
      });
    },
  };
});

class TestCollectionFieldInterface {
  name = '';
  group = '';
  filterable?: {
    operators?: any[];
    children?: any[];
  };
}

function createMockFlowApp() {
  const components: Record<string, any> = {};
  const fieldInterfaceMap = new Map<string, TestCollectionFieldInterface>();
  const collectionFieldInterfaceManager = {
    getFieldInterface(name: string) {
      return fieldInterfaceMap.get(name);
    },
  };

  return {
    dataSourceManager: {
      collectionFieldInterfaceManager,
    },
    addFieldInterfaces(fieldInterfaceClasses: Array<new (...args: any[]) => TestCollectionFieldInterface> = []) {
      fieldInterfaceClasses.forEach((FieldInterfaceClass) => {
        const instance = new FieldInterfaceClass(collectionFieldInterfaceManager);
        if (instance?.name) {
          fieldInterfaceMap.set(instance.name, instance);
        }
      });
    },
    addComponents(nextComponents: Record<string, any>) {
      Object.assign(components, nextComponents);
    },
    getComponent(name: string) {
      return components[name];
    },
  };
}

vi.mock('../../locale', () => ({
  NAMESPACE: 'workflow',
  useT: () => (key: string) => key,
}));

vi.mock('../../canvas/useWorkflowVariableOptions', () => ({
  useWorkflowVariableOptions: () => [
    {
      name: '$jobsMapByNodeKey',
      title: 'Node result',
      type: '',
      paths: ['$jobsMapByNodeKey'],
      children: [
        {
          name: 'n1',
          title: 'Create post',
          type: 'object',
          paths: ['$jobsMapByNodeKey', 'n1'],
          children: [{ name: 'title', title: 'Title', type: 'string', paths: ['$jobsMapByNodeKey', 'n1', 'title'] }],
        },
      ],
    },
  ],
}));

function setupEngine() {
  const engine = new FlowEngine();
  const app = createMockFlowApp();

  class InputInterface extends TestCollectionFieldInterface {
    name = 'input';
    group = 'basic';
    filterable = {
      operators: [
        { value: '$eq', label: 'Equals' },
        { value: '$null', label: 'Is null', noValue: true },
      ],
    };
  }

  app.addFieldInterfaces([InputInterface]);
  engine.context.defineProperty('app', { value: app });

  const ds = engine.dataSourceManager.getDataSource('main');
  ds.addCollection({
    name: 'posts',
    fields: [{ name: 'title', type: 'string', interface: 'input', uiSchema: { 'x-component': 'Input' } }],
  });

  return { engine };
}

describe('FilterDynamicComponent', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    testState.variableFilterItems = [];
  });

  it('renders as a React component instead of throwing from the resource FilterGroup class', () => {
    const { engine } = setupEngine();
    const onChange = vi.fn();

    render(
      <FlowEngineProvider engine={engine}>
        <FilterDynamicComponent collection="posts" value={{}} onChange={onChange} />
      </FlowEngineProvider>,
    );

    expect(screen.getByText(/conditions in the group/i)).toBeInTheDocument();
    expect(screen.getByTestId('filter-select-all-or-any')).toBeInTheDocument();
    expect(screen.getByText('Add condition')).toBeInTheDocument();
    expect(screen.queryByText('Select field')).not.toBeInTheDocument();
  });

  it('renders an existing legacy query object as an editable condition row', () => {
    const { engine } = setupEngine();

    render(
      <FlowEngineProvider engine={engine}>
        <FilterDynamicComponent
          collection="posts"
          value={{ $and: [{ title: { $eq: 'foo' } }] }}
          onChange={() => undefined}
        />
      </FlowEngineProvider>,
    );

    expect(screen.getByDisplayValue('foo')).toBeInTheDocument();
  });

  it('keeps an empty draft condition row visible after clicking Add condition', () => {
    const { engine } = setupEngine();
    function Wrapper() {
      const [value, setValue] = React.useState<Record<string, unknown>>({});
      return <FilterDynamicComponent collection="posts" value={value} onChange={(next) => setValue(next ?? {})} />;
    }

    render(
      <FlowEngineProvider engine={engine}>
        <Wrapper />
      </FlowEngineProvider>,
    );

    fireEvent.click(screen.getByText('Add condition'));

    expect(screen.getByTestId('variable-filter-item')).toBeInTheDocument();
    expect(testState.variableFilterItems).toHaveLength(1);
  });

  it('defaults maxAssociationFieldDepth to 2 for v1-compatible workflow filters', () => {
    const { engine } = setupEngine();

    render(
      <FlowEngineProvider engine={engine}>
        <FilterDynamicComponent
          collection="posts"
          value={{ $and: [{ title: { $eq: 'foo' } }] }}
          onChange={() => undefined}
        />
      </FlowEngineProvider>,
    );

    expect(testState.variableFilterItems.length).toBeGreaterThan(0);
    expect(testState.variableFilterItems.at(-1)?.maxAssociationFieldDepth).toBe(2);
  });

  it('passes through a custom maxAssociationFieldDepth when consumers override it', () => {
    const { engine } = setupEngine();

    render(
      <FlowEngineProvider engine={engine}>
        <FilterDynamicComponent
          collection="posts"
          value={{ $and: [{ title: { $eq: 'foo' } }] }}
          onChange={() => undefined}
          maxAssociationFieldDepth={3}
        />
      </FlowEngineProvider>,
    );

    expect(testState.variableFilterItems.length).toBeGreaterThan(0);
    expect(testState.variableFilterItems.at(-1)?.maxAssociationFieldDepth).toBe(3);
  });

  it('provides the filter model context to nested value editors', () => {
    const { engine } = setupEngine();
    function Wrapper() {
      const [value, setValue] = React.useState<Record<string, unknown>>({});
      return <FilterDynamicComponent collection="posts" value={value} onChange={(next) => setValue(next ?? {})} />;
    }

    render(
      <FlowEngineProvider engine={engine}>
        <Wrapper />
      </FlowEngineProvider>,
    );

    fireEvent.click(screen.getByText('Add condition'));

    expect(screen.getByTestId('variable-filter-item')).toHaveAttribute('data-flow-model-translate', 'function');
  });

  it('keeps an empty draft condition group visible after clicking Add condition group', async () => {
    const { engine } = setupEngine();
    function Wrapper() {
      const [value, setValue] = React.useState<Record<string, unknown>>({});
      return <FilterDynamicComponent collection="posts" value={value} onChange={(next) => setValue(next ?? {})} />;
    }

    render(
      <FlowEngineProvider engine={engine}>
        <Wrapper />
      </FlowEngineProvider>,
    );

    fireEvent.click(screen.getByText('Add condition group'));

    await waitFor(() => {
      expect(screen.getAllByTestId('filter-select-all-or-any').length).toBeGreaterThanOrEqual(2);
    });
  });

  it('round-trips workflow variable expressions through the variable-aware filter item', async () => {
    const { engine } = setupEngine();
    const onChange = vi.fn();

    render(
      <FlowEngineProvider engine={engine}>
        <FilterDynamicComponent
          collection="posts"
          value={{ $and: [{ title: { $eq: '{{$jobsMapByNodeKey.n1.title}}' } }] }}
          onChange={onChange}
        />
      </FlowEngineProvider>,
    );

    expect(screen.getByDisplayValue('{{ ctx.$jobsMapByNodeKey.n1.title }}')).toBeInTheDocument();

    fireEvent.change(screen.getByTestId('variable-filter-item'), {
      target: { value: '{{ ctx.$jobsMapByNodeKey.n1.body }}' },
    });

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith({ $and: [{ title: { $eq: '{{$jobsMapByNodeKey.n1.body}}' } }] });
    });
  });

  it('can disable right-side variable input for trigger-only filter usage', () => {
    const { engine } = setupEngine();

    render(
      <FlowEngineProvider engine={engine}>
        <FilterDynamicComponent collection="posts" value={{}} onChange={() => undefined} rightAsVariable={false} />
      </FlowEngineProvider>,
    );

    fireEvent.click(screen.getByText('Add condition'));

    expect(testState.variableFilterItems).toHaveLength(1);
    expect(testState.variableFilterItems[0].rightAsVariable).toBe(false);
  });

  it('passes disabled state through to the shared variable filter item', () => {
    const { engine } = setupEngine();

    render(
      <FlowEngineProvider engine={engine}>
        <FilterDynamicComponent
          collection="posts"
          value={{ $and: [{ title: { $eq: 'foo' } }] }}
          onChange={() => undefined}
          disabled
        />
      </FlowEngineProvider>,
    );

    expect(testState.variableFilterItems.length).toBeGreaterThan(0);
    expect(testState.variableFilterItems.at(-1)?.disabled).toBe(true);
    expect(screen.getByText('Add condition').closest('button')).toBeDisabled();
    expect(screen.getByText('Add condition group').closest('button')).toBeDisabled();
  });

  it('inherits disabled state from the parent form', () => {
    const { engine } = setupEngine();

    render(
      <FlowEngineProvider engine={engine}>
        <Form disabled>
          <FilterDynamicComponent
            collection="posts"
            value={{ $and: [{ title: { $eq: 'foo' } }] }}
            onChange={() => undefined}
          />
        </Form>
      </FlowEngineProvider>,
    );

    expect(testState.variableFilterItems.length).toBeGreaterThan(0);
    expect(testState.variableFilterItems.at(-1)?.disabled).toBe(true);
    expect(screen.getByText('Add condition').closest('button')).toBeDisabled();
    expect(screen.getByText('Add condition group').closest('button')).toBeDisabled();
  });
});
