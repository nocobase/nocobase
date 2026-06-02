/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@nocobase/test/client';
import { MobileLazySelect } from '../MobileLazySelect';

const OPTIONS = [
  { id: 1, name: 'Org A' },
  { id: 2, name: 'Org B' },
];

const mockState = vi.hoisted(() => ({
  checklistProps: undefined as any,
}));

function resetMockState() {
  mockState.checklistProps = undefined;
}

function renderSelect(props: Record<string, any> = {}) {
  const onChange = props.onChange ?? vi.fn();

  render(
    <MobileLazySelect
      fieldNames={{ value: 'id', label: 'name' }}
      multiple
      allowMultiple
      value={[]}
      options={OPTIONS}
      onChange={onChange}
      {...props}
    />,
  );

  return { onChange };
}

vi.mock('@nocobase/flow-engine', async () => {
  const actual = await vi.importActual<any>('@nocobase/flow-engine');
  return {
    ...actual,
    useFlowModel: () => ({
      context: {
        collectionField: {
          targetCollection: undefined,
        },
      },
      subModels: {},
    }),
    useFlowModelContext: () => ({
      t: (value: string) => value,
    }),
  };
});

vi.mock('antd', async () => {
  const actual = await vi.importActual<any>('antd');
  return {
    ...actual,
    Select: (props: any) => (
      <button type="button" data-testid="select-trigger" onClick={props.onClick}>
        Select
      </button>
    ),
  };
});

vi.mock('antd-mobile', () => {
  const MockCheckList: any = (props: any) => {
    mockState.checklistProps = props;
    return <div data-testid="checklist">{props.children}</div>;
  };

  MockCheckList.Item = ({ value, children }: any) => <div data-testid={`item-${value}`}>{children}</div>;

  return {
    Button: (props: any) => (
      <button type="button" data-testid="confirm" onClick={props.onClick}>
        {props.children}
      </button>
    ),
    Popup: (props: any) => (props.visible ? <div data-testid="popup">{props.children}</div> : null),
    SearchBar: ({ value, onChange }: any) => (
      <input data-testid="search" value={value ?? ''} onChange={(e) => onChange?.(e.target.value)} />
    ),
    CheckList: MockCheckList,
    SpinLoading: () => <div data-testid="loading" />,
  };
});

describe('MobileLazySelect', () => {
  beforeEach(() => {
    resetMockState();
  });

  it('commits association records immediately when selecting in multiple mode', () => {
    const { onChange } = renderSelect();

    act(() => {
      fireEvent.click(screen.getByTestId('select-trigger'));
    });

    act(() => {
      mockState.checklistProps?.onChange?.([1, 2]);
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(OPTIONS);
  });

  it('commits target key values immediately in value mode', () => {
    const { onChange } = renderSelect({ valueMode: 'value' });

    act(() => {
      fireEvent.click(screen.getByTestId('select-trigger'));
    });

    act(() => {
      mockState.checklistProps?.onChange?.([1, 2]);
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith([1, 2]);
  });

  it('does not recommit multiple selections when confirming', () => {
    const { onChange } = renderSelect();

    act(() => {
      fireEvent.click(screen.getByTestId('select-trigger'));
    });

    act(() => {
      mockState.checklistProps?.onChange?.([1, 2]);
    });
    act(() => {
      fireEvent.click(screen.getByTestId('confirm'));
    });

    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
