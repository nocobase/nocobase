/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { observable } from '@formily/reactive';
import { FlowEngine, FlowModel } from '@nocobase/flow-engine';
import { Application } from '../../../../application/Application';
import { LinkageFilterItem } from '../LinkageFilterItem';

vi.mock('@nocobase/flow-engine', async () => {
  const actual = await vi.importActual<any>('@nocobase/flow-engine');
  const MockVariableInput = (props: any) => {
    const { value, onChange, converters, showValueComponent } = props;
    if (
      showValueComponent &&
      converters &&
      typeof converters.renderInputComponent === 'function' &&
      typeof converters.resolvePathFromValue === 'function'
    ) {
      const resolvedPath = converters.resolvePathFromValue(value);
      const meta = Array.isArray(resolvedPath) ? { paths: resolvedPath } : undefined;
      const Renderer = meta ? converters.renderInputComponent(meta) : null;
      if (Renderer) {
        return <Renderer value={value} onChange={onChange} style={{}} />;
      }
    }

    return (
      <button
        type="button"
        data-testid="variable-input"
        onClick={() =>
          onChange?.(
            (globalThis as any).__TEST_PATH__ || 'name',
            (globalThis as any).__TEST_META__ || {
              interface: 'input',
              uiSchema: { 'x-component': 'Input' },
              paths: ['collection', 'name'],
              name: 'name',
              title: 'Name',
              type: 'string',
            },
          )
        }
      >
        mock-variable-input
      </button>
    );
  };

  return { ...actual, VariableInput: MockVariableInput };
});

function createModel() {
  const engine = new FlowEngine();
  const model = new FlowModel({ uid: 'm-linkage-filter', flowEngine: engine });
  const app = new Application({});
  model.context.defineProperty('app', { value: app });
  return { model, app };
}

describe('LinkageFilterItem', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    delete (globalThis as any).__TEST_PATH__;
    delete (globalThis as any).__TEST_META__;
  });

  it('preserves ReactNode operator labels instead of stringifying them', async () => {
    const value = observable({ path: '', operator: '', value: '' }) as any;
    const { model } = createModel();

    (globalThis as any).__TEST_META__ = {
      interface: 'input',
      uiSchema: {
        'x-component': 'Input',
        'x-filter-operators': [
          {
            value: '$in',
            label: <span>custom react label</span>,
            selected: true,
            schema: { 'x-component': 'Input' },
          },
        ],
      },
      paths: ['collection', 'name'],
      name: 'name',
      title: 'Name',
      type: 'string',
    };

    const view = render(<LinkageFilterItem value={value} model={model} />);
    fireEvent.click(screen.getByTestId('variable-input'));

    await waitFor(() => {
      expect(value.operator).toBe('$in');
      expect(screen.getByText('custom react label')).toBeTruthy();
    });

    fireEvent.mouseDown(view.container.querySelector('.ant-select-selector') as Element);
    expect(screen.getAllByText('custom react label').length).toBeGreaterThan(0);
    expect(screen.queryByText('[object Object]')).toBeNull();
  });

  it('renders operator schema component for multi-keyword constants', async () => {
    const value = observable({ path: '', operator: '', value: 'foo\nbar' }) as any;
    const { model, app } = createModel();

    const MultipleKeywordsInput = ({
      value: inputValue,
      onChange,
    }: {
      value?: string[];
      onChange?: (v: string[]) => void;
    }) => {
      return (
        <button
          type="button"
          data-testid="keyword-input"
          data-value={JSON.stringify(inputValue || [])}
          onClick={() => onChange?.(['alpha', 'beta'])}
        >
          keyword-input
        </button>
      );
    };
    app.addComponents({ MultipleKeywordsInput });

    (globalThis as any).__TEST_META__ = {
      interface: 'input',
      uiSchema: {
        'x-component': 'Input',
        'x-filter-operators': [
          {
            value: '$in',
            label: 'contains any',
            selected: true,
            schema: {
              'x-component': 'MultipleKeywordsInput',
              'x-component-props': { fieldInterface: 'input' },
            },
          },
        ],
      },
      paths: ['collection', 'name'],
      name: 'name',
      title: 'Name',
      type: 'string',
    };

    render(<LinkageFilterItem value={value} model={model} />);
    fireEvent.click(screen.getByTestId('variable-input'));

    const keywordInput = await screen.findByTestId('keyword-input');
    expect(keywordInput.getAttribute('data-value')).toBe(JSON.stringify(['foo', 'bar']));

    fireEvent.click(keywordInput);
    await waitFor(() => {
      expect(value.value).toEqual(['alpha', 'beta']);
    });
  });

  it('passes enum options to single select multi-value operators', async () => {
    const value = observable({ path: '', operator: '', value: ['draft'] }) as any;
    const { model, app } = createModel();

    const MultipleKeywordsInput = ({
      value: inputValue,
      options,
    }: {
      value?: string[];
      options?: Array<{ label: string; value: string }>;
    }) => {
      return (
        <button
          type="button"
          data-testid="keyword-select-input"
          data-value={JSON.stringify(inputValue || [])}
          data-options={JSON.stringify(options || [])}
        >
          keyword-select-input
        </button>
      );
    };
    app.addComponents({ MultipleKeywordsInput });

    (globalThis as any).__TEST_META__ = {
      interface: 'select',
      uiSchema: {
        'x-component': 'Select',
        enum: [
          { label: 'Draft', value: 'draft' },
          { label: 'Published', value: 'published' },
        ],
        'x-filter-operators': [
          {
            value: '$in',
            label: 'is any of',
            selected: true,
            schema: {
              'x-component': 'MultipleKeywordsInput',
              'x-component-props': { mode: 'tags' },
            },
          },
        ],
      },
      paths: ['collection', 'status'],
      name: 'status',
      title: 'Status',
      type: 'string',
    };

    render(<LinkageFilterItem value={value} model={model} />);
    fireEvent.click(screen.getByTestId('variable-input'));

    const keywordInput = await screen.findByTestId('keyword-select-input');
    expect(keywordInput.getAttribute('data-value')).toBe(JSON.stringify(['draft']));
    expect(keywordInput.getAttribute('data-options')).toBe(
      JSON.stringify([
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ]),
    );
  });

  it('normalizes keyword arrays when switching back to a scalar operator', async () => {
    const value = observable({ path: '', operator: '', value: 'foo\nbar' }) as any;
    const { model, app } = createModel();

    const MultipleKeywordsInput = ({
      value: inputValue,
      onChange,
    }: {
      value?: string[];
      onChange?: (v: string[]) => void;
    }) => {
      return (
        <button
          type="button"
          data-testid="keyword-input"
          data-value={JSON.stringify(inputValue || [])}
          onClick={() => onChange?.(['alpha', 'beta'])}
        >
          keyword-input
        </button>
      );
    };
    app.addComponents({ MultipleKeywordsInput });

    (globalThis as any).__TEST_META__ = {
      interface: 'input',
      uiSchema: {
        'x-component': 'Input',
        'x-filter-operators': [
          {
            value: '$in',
            label: 'contains any',
            selected: true,
            schema: {
              'x-component': 'MultipleKeywordsInput',
              'x-component-props': { fieldInterface: 'input' },
            },
          },
          {
            value: '$eq',
            label: 'is',
            schema: { 'x-component': 'Input' },
          },
        ],
      },
      paths: ['collection', 'name'],
      name: 'name',
      title: 'Name',
      type: 'string',
    };

    const view = render(<LinkageFilterItem value={value} model={model} />);
    fireEvent.click(screen.getByTestId('variable-input'));
    fireEvent.click(await screen.findByTestId('keyword-input'));

    await waitFor(() => {
      expect(value.value).toEqual(['alpha', 'beta']);
    });

    fireEvent.mouseDown(view.container.querySelector('.ant-select-selector') as Element);
    fireEvent.click(await screen.findByText('is'));

    await waitFor(() => {
      expect(value.operator).toBe('$eq');
      expect(value.value).toBe('alpha\nbeta');
    });
  });
});
