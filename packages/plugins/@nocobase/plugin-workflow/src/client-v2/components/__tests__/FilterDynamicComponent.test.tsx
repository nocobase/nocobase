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
import { FilterDynamicComponent } from '../FilterDynamicComponent';

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

    expect(screen.getByText('Select field')).toBeInTheDocument();
    expect(screen.getByText('Comparision')).toBeInTheDocument();
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
});
