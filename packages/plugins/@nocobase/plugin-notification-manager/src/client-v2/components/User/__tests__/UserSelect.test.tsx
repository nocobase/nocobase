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
