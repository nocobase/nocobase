/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { type ComponentProps, type ReactNode } from 'react';
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

type SelectProps = ComponentProps<(typeof import('antd'))['Select']>;
type PopupProps = ComponentProps<(typeof import('antd-mobile'))['Popup']>;
type CheckListProps = ComponentProps<(typeof import('antd-mobile'))['CheckList']>;
type ButtonProps = ComponentProps<(typeof import('antd-mobile'))['Button']>;
type SearchBarProps = ComponentProps<(typeof import('antd-mobile'))['SearchBar']>;
type ConfigProviderProps = ComponentProps<(typeof import('antd-mobile'))['ConfigProvider']>;
type MobileLocale = {
  locale: string;
  common: { cancel: string };
  SearchBar: { name: string };
};

const mockState = vi.hoisted(() => ({
  selectProps: undefined as SelectProps | undefined,
  popupProps: undefined as PopupProps | undefined,
  checklistProps: undefined as CheckListProps | undefined,
  confirmButtonProps: undefined as ButtonProps | undefined,
  mobileLocale: {
    locale: 'zh-CH',
    common: { cancel: '取消' },
    SearchBar: { name: '搜索框' },
  },
  flowLocale: 'en-US',
}));

function resetMockState() {
  mockState.selectProps = undefined;
  mockState.popupProps = undefined;
  mockState.checklistProps = undefined;
  mockState.confirmButtonProps = undefined;
  mockState.mobileLocale = {
    locale: 'zh-CH',
    common: { cancel: '取消' },
    SearchBar: { name: '搜索框' },
  };
  mockState.flowLocale = 'en-US';
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
      locale: mockState.flowLocale,
      t: (value: string) =>
        ({
          'zh-CN': {
            Cancel: '取消',
            Search: '搜索',
            search: '搜索',
          },
          'zh-TW': {
            Cancel: '取消',
            Search: '搜尋',
            search: '搜尋',
          },
        })[mockState.flowLocale]?.[value] || value,
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
    Select: (props: SelectProps) => {
      mockState.selectProps = props;
      return <div data-testid="antd-select" />;
    },
  };
});

vi.mock('antd-mobile', () => {
  const MockCheckList = (props: CheckListProps) => {
    mockState.checklistProps = props;
    return <div data-testid="checklist">{props.children}</div>;
  };

  MockCheckList.Item = ({ value, children }: { value: string | number; children?: ReactNode }) => (
    <div data-testid={`item-${value}`}>{children}</div>
  );

  return {
    ConfigProvider: ({ children, locale }: ConfigProviderProps) => {
      mockState.mobileLocale = locale as MobileLocale;
      return <>{children}</>;
    },
    useConfig: () => ({ locale: mockState.mobileLocale }),
    Button: (props: ButtonProps) => {
      mockState.confirmButtonProps = props;
      return (
        <button type="button" data-testid="confirm" onClick={props.onClick}>
          {props.children}
        </button>
      );
    },
    Popup: (props: PopupProps) => {
      mockState.popupProps = props;
      return props.visible ? <div data-testid="popup">{props.children}</div> : null;
    },
    SearchBar: ({ value, onChange, onCancel, cancelText, placeholder, showCancelButton }: SearchBarProps) => (
      <div>
        <input
          aria-label={mockState.mobileLocale.SearchBar.name}
          data-testid="search"
          placeholder={placeholder}
          type="search"
          value={value ?? ''}
          onChange={(e) => onChange?.(e.target.value)}
        />
        {showCancelButton && value ? (
          <button type="button" onClick={onCancel}>
            {cancelText ?? mockState.mobileLocale.common.cancel}
          </button>
        ) : null}
      </div>
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

  it('localizes the search input accessible name', () => {
    renderMobileSelect();

    openPopup();

    expect(screen.getByRole('searchbox', { name: 'Search' })).toBeInTheDocument();
  });

  it('renders a translated cancel action after searching', () => {
    renderMobileSelect();

    openPopup();
    act(() => {
      fireEvent.change(screen.getByTestId('search'), { target: { value: 'Option' } });
    });

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('preserves the Chinese search input accessible name', () => {
    mockState.flowLocale = 'zh-CN';
    renderMobileSelect();

    openPopup();
    act(() => {
      fireEvent.change(screen.getByTestId('search'), { target: { value: 'Option' } });
    });

    expect(screen.getByRole('searchbox', { name: '搜索框' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '取消' })).toBeInTheDocument();
  });

  it('does not reuse the simplified Chinese accessible name for traditional Chinese', () => {
    mockState.flowLocale = 'zh-TW';
    renderMobileSelect();

    openPopup();

    expect(screen.getByRole('searchbox', { name: '搜尋' })).toBeInTheDocument();
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

  it('renders a translated cancel action after searching', () => {
    renderMobileLazySelect();

    openLazyPopup();
    act(() => {
      fireEvent.change(screen.getByTestId('search'), { target: { value: '11' } });
    });

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('clears the selected relation record when it is tapped again in single mode', () => {
    const { onChange } = renderMobileLazySelect({
      value: RELATION_OPTIONS[0],
      multiple: false,
    });

    openLazyPopup();
    expect(mockState.checklistProps?.value).toEqual([RELATION_OPTIONS[0].uuid]);

    selectValues([]);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(undefined);
    expect(screen.queryByTestId('popup')).not.toBeInTheDocument();
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
