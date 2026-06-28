/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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

async function openVariableMenu() {
  fireEvent.click(await screen.findByRole('button', { name: 'x' }));
}

function getRootMenuItemTexts() {
  return Array.from(document.querySelectorAll('.ant-cascader-menu:first-child .ant-cascader-menu-item-content'))
    .map((item) => item.textContent?.trim())
    .filter(Boolean);
}

function getMenuItem(text: string) {
  const content = screen.getByText(text);
  return content.closest('.ant-cascader-menu-item') as HTMLElement;
}

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

  it('restricts workflow receiver variables to user id fields', async () => {
    holder.ctx = {
      api: {
        resource: () => ({
          list: vi.fn().mockResolvedValue({ data: { data: [] } }),
        }),
      },
    };

    render(<UserSelect value="" onChange={() => undefined} variableOptions={[]} />);
    expect(await screen.findByRole('combobox')).toBeInTheDocument();

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

  it('aligns the receiver variable menu roots with the workflow picker order', async () => {
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

    await openVariableMenu();

    await waitFor(() => {
      expect(getRootMenuItemTexts()).toEqual([
        'Null',
        'Constant',
        'Scope variables',
        'Node result',
        'Trigger variables',
        'System variables',
        'Variables and secrets',
      ]);
    });
    expect(getMenuItem('Scope variables').className).toContain('ant-cascader-menu-item-disabled');
    expect(getMenuItem('Node result').className).toContain('ant-cascader-menu-item-disabled');
    expect(getMenuItem('Trigger variables').className).not.toContain('ant-cascader-menu-item-disabled');
  });

  it('keeps available scope and node-result roots selectable', async () => {
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

    await openVariableMenu();

    await waitFor(() => {
      expect(getRootMenuItemTexts()).toEqual([
        'Null',
        'Constant',
        'Scope variables',
        'Node result',
        'Trigger variables',
      ]);
    });
    expect(getMenuItem('Scope variables').className).not.toContain('ant-cascader-menu-item-disabled');
    expect(getMenuItem('Node result').className).not.toContain('ant-cascader-menu-item-disabled');

    fireEvent.click(screen.getByText('Scope variables'));
    expect(await screen.findByText('Loop item')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Node result'));
    expect(await screen.findByText('Previous node')).toBeInTheDocument();
  });

  it('shows system variable tooltip in the receiver menu without changing the saved value', async () => {
    const onChange = vi.fn();
    workflow.useWorkflowVariableOptions.mockReturnValue([
      {
        name: '$system',
        title: 'System variables',
        type: '',
        paths: ['$system'],
        children: [
          {
            name: 'instanceId',
            title: 'Instance ID',
            type: '',
            paths: ['$system', 'instanceId'],
            options: { tooltip: 'The ID of current server instance' },
          },
        ],
      },
    ]);
    holder.ctx = {
      t: (key: string) => key,
      api: {
        resource: () => ({
          list: vi.fn().mockResolvedValue({ data: { data: [] } }),
        }),
      },
    };

    render(<UserSelect value="" onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'x' }));
    fireEvent.click(await screen.findByText('System variables'));

    expect(await screen.findByText('Instance ID')).toBeInTheDocument();
    const tooltipIcon = screen.getByLabelText('Instance ID tooltip');
    expect(tooltipIcon).toBeInTheDocument();

    fireEvent.mouseEnter(tooltipIcon);
    const tooltip = await screen.findByText('The ID of current server instance');
    expect(tooltip.closest('.ant-tooltip')).toHaveClass('ant-tooltip-placement-top');

    fireEvent.click(screen.getByText('Instance ID'));
    expect(onChange).toHaveBeenLastCalledWith('{{$system.instanceId}}');
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
