/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@nocobase/test/client';
import { MobileLazySelect } from '../MobileLazySelect';
import { MobileSelect } from '../MobileSelect';

const DEFAULT_OPTIONS = [
  { label: 'Option A', value: 'a' },
  { label: 'Option B', value: 'b' },
];

const RELATION_OPTIONS = [
  { uuid: '05f6a3b4-bfb7-7943-578a-3819e2687a7e' },
  { uuid: 'c7d99828-a1de-9e70-4c2d-b0139abdf02e' },
];

const mockState = vi.hoisted(() => ({
  selectProps: undefined as any,
  popupProps: undefined as any,
  checklistProps: undefined as any,
  confirmButtonProps: undefined as any,
}));

function resetMockState() {
  mockState.selectProps = undefined;
  mockState.popupProps = undefined;
  mockState.checklistProps = undefined;
  mockState.confirmButtonProps = undefined;
}

function clickTrigger() {
  const trigger = screen.getByTestId('antd-select').parentElement as HTMLElement | null;
  expect(trigger).toBeTruthy();
  act(() => {
    fireEvent.click(trigger as HTMLElement);
  });
}

function openPopup() {
  clickTrigger();
  expect(screen.getByTestId('popup')).toBeInTheDocument();
}

function openLazyPopup() {
  act(() => {
    mockState.selectProps?.onClick?.();
  });
  expect(screen.getByTestId('popup')).toBeInTheDocument();
}

function selectValues(values: string[]) {
  act(() => {
    mockState.checklistProps?.onChange?.(values);
  });
}

function confirmSelection() {
  act(() => {
    mockState.confirmButtonProps?.onClick?.();
  });
}

function renderMobileSelect(props: Record<string, any> = {}) {
  const onChange = props.onChange ?? vi.fn();
  const onChangeComplete = props.onChangeComplete ?? vi.fn();

  render(
    <MobileSelect
      value={undefined}
      options={DEFAULT_OPTIONS}
      onChange={onChange}
      onChangeComplete={onChangeComplete}
      {...props}
    />,
  );

  return { onChange, onChangeComplete };
}

function renderMobileLazySelect(props: Record<string, any> = {}) {
  const onChange = props.onChange ?? vi.fn();
  const renderComponent = (nextProps: Record<string, any> = {}) => (
    <MobileLazySelect
      fieldNames={{ label: 'uuid', value: 'uuid' }}
      value={[]}
      multiple
      allowMultiple
      options={RELATION_OPTIONS}
      {...props}
      {...nextProps}
      onChange={onChange}
    />
  );

  const result = render(renderComponent());

  return {
    ...result,
    onChange,
    rerender: (nextProps: Record<string, any> = {}) => result.rerender(renderComponent(nextProps)),
  };
}

vi.mock('@nocobase/flow-engine', async () => {
  const actual = await vi.importActual<any>('@nocobase/flow-engine');
  return {
    ...actual,
    useFlowModelContext: () => ({
      t: (value: string) => value,
    }),
    useFlowModel: () => ({
      context: {
        collectionField: {},
      },
      subModels: {},
    }),
  };
});

vi.mock('antd', async () => {
  const actual = await vi.importActual<any>('antd');
  return {
    ...actual,
    Select: (props: any) => {
      mockState.selectProps = props;
      return <div data-testid="antd-select" />;
    },
  };
});

vi.mock('antd-mobile', () => {
  const MockCheckList: any = (props: any) => {
    mockState.checklistProps = props;
    return <div data-testid="checklist">{props.children}</div>;
  };

  MockCheckList.Item = ({ value, children }: any) => <div data-testid={`item-${value}`}>{children}</div>;

  return {
    Button: (props: any) => {
      mockState.confirmButtonProps = props;
      return (
        <button type="button" data-testid="confirm" onClick={props.onClick}>
          {props.children}
        </button>
      );
    },
    Popup: (props: any) => {
      mockState.popupProps = props;
      return props.visible ? <div data-testid="popup">{props.children}</div> : null;
    },
    SearchBar: ({ value, onChange }: any) => (
      <input data-testid="search" value={value ?? ''} onChange={(e) => onChange?.(e.target.value)} />
    ),
    CheckList: MockCheckList,
  };
});

describe('MobileSelect', () => {
  beforeEach(() => {
    resetMockState();
  });

  it('commits the selected value immediately in single mode', () => {
    const { onChange, onChangeComplete } = renderMobileSelect();

    openPopup();
    selectValues(['a']);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('a');
    expect(onChangeComplete).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('popup')).not.toBeInTheDocument();
  });

  it('renders filtered options based on search text', () => {
    const { onChange, onChangeComplete } = renderMobileSelect();
    openPopup();
    act(() => {
      fireEvent.change(screen.getByTestId('search'), { target: { value: 'Option A' } });
    });

    expect(screen.getByTestId('item-a')).toBeInTheDocument();
    expect(screen.queryByTestId('item-b')).not.toBeInTheDocument();

    selectValues(['a']);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('a');
    expect(onChangeComplete).toHaveBeenCalledTimes(1);
  });

  it('defers commit until confirm in multiple mode', () => {
    const { onChange, onChangeComplete } = renderMobileSelect({ value: [], mode: 'multiple' });
    openPopup();

    selectValues(['a', 'b']);
    expect(onChange).not.toHaveBeenCalled();
    expect(onChangeComplete).not.toHaveBeenCalled();

    confirmSelection();

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(['a', 'b']);
    expect(onChangeComplete).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('popup')).not.toBeInTheDocument();
  });

  it('does not open popup when disabled', () => {
    renderMobileSelect({ disabled: true });

    clickTrigger();
    expect(screen.queryByTestId('popup')).not.toBeInTheDocument();
  });

  it('prefers displayValue for trigger rendering', () => {
    const displayValue = [{ label: 'Published', value: 'published' }];
    renderMobileSelect({ value: ['published'], displayValue, mode: 'multiple' });

    expect(mockState.selectProps?.value).toEqual(displayValue);
  });
});

function SubTableCellHarness({ value, onCommit, mode }: { value: any; onCommit: (value: any) => void; mode?: string }) {
  const pendingValueRef = React.useRef<any>(value);
  return (
    <div>
      <MobileSelect
        value={value}
        mode={mode}
        options={DEFAULT_OPTIONS}
        onChange={(next) => {
          pendingValueRef.current = next;
          if (Array.isArray(next)) {
            onCommit(next);
          }
        }}
        onChangeComplete={() => {
          onCommit(pendingValueRef.current);
        }}
      />
    </div>
  );
}

describe('MobileSelect in SubForm/SubTable containers', () => {
  beforeEach(() => {
    resetMockState();
  });

  it('SubTable: single selection commits final value via onChangeComplete', () => {
    const onCommit = vi.fn();

    render(<SubTableCellHarness value={undefined} onCommit={onCommit} />);

    openPopup();
    selectValues(['b']);

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith('b');
  });

  it('SubTable: multiple mode only commits after confirm, and commit receives the full array', () => {
    const onCommit = vi.fn();

    render(<SubTableCellHarness value={[]} onCommit={onCommit} mode="multiple" />);

    openPopup();
    selectValues(['a', 'b']);
    confirmSelection();

    expect(onCommit).toHaveBeenCalledTimes(2);
    expect(onCommit).toHaveBeenNthCalledWith(1, ['a', 'b']);
    expect(onCommit).toHaveBeenNthCalledWith(2, ['a', 'b']);
  });
});

describe('MobileLazySelect', () => {
  beforeEach(() => {
    resetMockState();
  });

  it('keeps pending relation records selected until confirm', () => {
    const { onChange, rerender } = renderMobileLazySelect();

    openLazyPopup();
    expect(mockState.checklistProps?.value).toEqual([]);

    selectValues(['c7d99828-a1de-9e70-4c2d-b0139abdf02e']);
    expect(mockState.checklistProps?.value).toEqual(['c7d99828-a1de-9e70-4c2d-b0139abdf02e']);

    rerender({
      options: RELATION_OPTIONS.map((item) => ({ ...item })),
    });

    expect(mockState.checklistProps?.value).toEqual(['c7d99828-a1de-9e70-4c2d-b0139abdf02e']);

    confirmSelection();

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith([RELATION_OPTIONS[1]]);
  });
});
