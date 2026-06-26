/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const holder = vi.hoisted(() => ({
  ctx: null as any,
  variableInput: vi.fn(),
}));

const workflow = vi.hoisted(() => ({
  FilterDynamicComponent: vi.fn((props: { collection?: string; value?: Record<string, unknown> }) => (
    <div data-collection={props.collection} data-testid="workflow-filter">
      {JSON.stringify(props.value ?? {})}
    </div>
  )),
  useWorkflowVariableOptions: vi.fn(() => []),
}));

vi.mock('@nocobase/flow-engine', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    useFlowContext: () => holder.ctx,
    VariableInput: (props: any) => {
      holder.variableInput(props);
      const path = props.converters?.resolvePathFromValue?.(props.value);
      const ConstantComponent =
        path?.[0] === 'constant' ? props.converters?.renderInputComponent?.({ paths: ['constant'] }) : null;
      return ConstantComponent ? <ConstantComponent value={props.value} onChange={props.onChange} /> : null;
    },
  };
});

vi.mock('@nocobase/plugin-workflow/client-v2', () => workflow);

vi.mock('../../../locale', () => ({
  useNotificationTranslation: () => ({ t: (key: string) => key }),
}));

import { UserSelect } from '../UserSelect';

describe('UserSelect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    workflow.useWorkflowVariableOptions.mockReturnValue([]);
  });

  it('renders a users dropdown for the empty constant receiver mode', async () => {
    holder.ctx = {
      api: {
        resource: () => ({
          list: vi.fn().mockResolvedValue({
            data: {
              data: [{ id: 1, nickname: 'Demo user' }],
            },
          }),
        }),
      },
    };

    render(<UserSelect value="" onChange={() => undefined} variableOptions={[]} />);

    expect(await screen.findByRole('combobox')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('restricts workflow receiver variables to user id fields', () => {
    holder.ctx = {
      api: {
        resource: () => ({
          list: vi.fn().mockResolvedValue({ data: { data: [] } }),
        }),
      },
    };

    render(<UserSelect value="{{ $jobsMapByNodeKey.n1.userId }}" onChange={() => undefined} variableOptions={[]} />);

    expect(workflow.useWorkflowVariableOptions).toHaveBeenCalledWith({ types: [expect.any(Function)] });

    const options = workflow.useWorkflowVariableOptions.mock.calls[0]?.[0] as {
      types: Array<(field: Record<string, unknown>) => boolean>;
    };
    const [isUserKeyField] = options.types;

    expect(isUserKeyField({ collectionName: 'users', name: 'id' })).toBe(true);
    expect(isUserKeyField({ collectionName: 'users', name: 'nickname' })).toBe(false);
    expect(isUserKeyField({ isForeignKey: true, target: 'users' })).toBe(true);
    expect(isUserKeyField({ isForeignKey: true, target: 'roles' })).toBe(false);
  });

  it('aligns the receiver variable menu roots with the workflow picker order', () => {
    workflow.useWorkflowVariableOptions.mockReturnValue([
      {
        name: '$context',
        title: 'Trigger variables',
        type: '',
        paths: ['$context'],
        children: [{ name: 'data', title: 'Trigger data', type: '', paths: ['$context', 'data'] }],
      },
      {
        name: '$system',
        title: 'System variables',
        type: '',
        paths: ['$system'],
        children: [{ name: 'now', title: 'System time', type: '', paths: ['$system', 'now'] }],
      },
      {
        name: '$env',
        title: 'Variables and secrets',
        type: '',
        paths: ['$env'],
        children: async () => [],
      },
    ]);
    holder.ctx = {
      api: {
        resource: () => ({
          list: vi.fn().mockResolvedValue({ data: { data: [] } }),
        }),
      },
    };

    render(<UserSelect value="{{ $context.data }}" onChange={() => undefined} />);

    const metaTree = holder.variableInput.mock.calls[0]?.[0]?.metaTree;
    expect(metaTree.map((node) => node.title)).toEqual([
      'Constant',
      'Scope variables',
      'Node result',
      'Trigger variables',
      'System variables',
      'Variables and secrets',
    ]);
    expect(metaTree[0]).toEqual(expect.objectContaining({ name: 'constant', paths: ['constant'] }));
    expect(metaTree[1]).toEqual(expect.objectContaining({ name: '$scopes', disabled: true, paths: ['$scopes'] }));
    expect(metaTree[2]).toEqual(
      expect.objectContaining({ name: '$jobsMapByNodeKey', disabled: true, paths: ['$jobsMapByNodeKey'] }),
    );
    expect(metaTree[3]).toEqual(expect.objectContaining({ name: '$context' }));
    expect(metaTree[3].disabled).toBeUndefined();
  });

  it('keeps available scope and node-result roots selectable', () => {
    workflow.useWorkflowVariableOptions.mockReturnValue([
      {
        name: '$context',
        title: 'Trigger variables',
        type: '',
        paths: ['$context'],
        children: [{ name: 'data', title: 'Trigger data', type: '', paths: ['$context', 'data'] }],
      },
      {
        name: '$jobsMapByNodeKey',
        title: 'Node result',
        type: '',
        paths: ['$jobsMapByNodeKey'],
        children: [
          {
            name: 'n1',
            title: 'Previous node',
            type: '',
            paths: ['$jobsMapByNodeKey', 'n1'],
          },
        ],
      },
      {
        name: '$scopes',
        title: 'Scope variables',
        type: '',
        paths: ['$scopes'],
        children: [{ name: 'loop', title: 'Loop item', type: '', paths: ['$scopes', 'loop'] }],
      },
    ]);
    holder.ctx = {
      api: {
        resource: () => ({
          list: vi.fn().mockResolvedValue({ data: { data: [] } }),
        }),
      },
    };

    render(<UserSelect value="{{ $context.data }}" onChange={() => undefined} />);

    const metaTree = holder.variableInput.mock.calls[0]?.[0]?.metaTree;
    expect(metaTree.map((node) => node.name)).toEqual(['constant', '$scopes', '$jobsMapByNodeKey', '$context']);
    expect(metaTree[1]).toEqual(expect.objectContaining({ name: '$scopes' }));
    expect(metaTree[1].disabled).toBeUndefined();
    expect(metaTree[1].children).toEqual([expect.objectContaining({ name: 'loop', paths: ['$scopes', 'loop'] })]);
    expect(metaTree[2]).toEqual(expect.objectContaining({ name: '$jobsMapByNodeKey' }));
    expect(metaTree[2].disabled).toBeUndefined();
    expect(metaTree[2].children).toEqual([expect.objectContaining({ name: 'n1', paths: ['$jobsMapByNodeKey', 'n1'] })]);
  });

  it('uses the workflow variable-aware filter for query receiver mode', () => {
    render(<UserSelect value={{ filter: { id: { $eq: '{{ $jobsMapByNodeKey.n1.userId }}' } } }} />);

    expect(screen.getByTestId('workflow-filter')).toHaveAttribute('data-collection', 'users');
    expect(workflow.FilterDynamicComponent.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        collection: 'users',
        value: { id: { $eq: '{{ $jobsMapByNodeKey.n1.userId }}' } },
      }),
    );
  });
});
