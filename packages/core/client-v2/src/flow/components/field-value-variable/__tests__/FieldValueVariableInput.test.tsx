/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { MetaTreeNode, VariableInputProps } from '@nocobase/flow-engine';
import { parseCtxDateExpressionConfig, serializeCtxDateExpressionConfig } from '@nocobase/flow-engine';
import { fireEvent, render, screen } from '@nocobase/test/client';
import { dayjs } from '@nocobase/utils/client';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DateVariableEditor, serializeExactDatePickerValue } from '../DateVariableEditor';
import {
  DEFAULT_DATE_VARIABLE_COMPONENT_PROPS,
  isDateLikeField,
  resolveDateVariableComponentProps,
  type DateVariableComponentProps,
} from '../dateValue';
import { FieldValueVariableInput } from '../FieldValueVariableInput';

const mocks = vi.hoisted(() => ({
  variableInputProps: undefined as VariableInputProps | undefined,
}));

vi.mock('@nocobase/flow-engine', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/flow-engine')>();
  return {
    ...actual,
    VariableInput: (props: VariableInputProps) => {
      mocks.variableInputProps = props;
      return <div data-testid="variable-input" />;
    },
    useFlowContext: () => ({
      isMobileLayout: false,
      model: { translate: (value: string) => value },
      t: (value: string) => value,
    }),
  };
});

const ConstantComponent: React.FC = () => <div>constant editor</div>;
const NullComponent: React.FC = () => <div>null editor</div>;
const RunJSComponent: React.FC = () => <div>runjs editor</div>;

function renderInput(options?: {
  value?: unknown;
  isDateLikeField?: boolean;
  dateComponentProps?: DateVariableComponentProps;
}) {
  const onChange = vi.fn();
  render(
    <FieldValueVariableInput
      value={options?.value}
      onChange={onChange}
      baseMetaTree={[{ name: 'currentUser', title: 'Current user', type: 'object', paths: ['currentUser'] }]}
      constantComponent={ConstantComponent}
      nullComponent={NullComponent}
      runJSComponent={RunJSComponent}
      isDateLikeField={options?.isDateLikeField ?? false}
      dateComponentProps={options?.dateComponentProps ?? DEFAULT_DATE_VARIABLE_COMPONENT_PROPS}
    />,
  );
  return onChange;
}

async function resolveMetaTree() {
  const provider = mocks.variableInputProps?.metaTree;
  const tree = typeof provider === 'function' ? await provider() : provider;
  return (tree || []) as MetaTreeNode[];
}

describe('FieldValueVariableInput', () => {
  beforeEach(() => {
    mocks.variableInputProps = undefined;
  });

  it('adds Date as a non-selectable first-level peer with complete second-level options', async () => {
    renderInput({ isDateLikeField: true });

    const tree = await resolveMetaTree();
    expect(tree.slice(0, 4).map((node) => node.name)).toEqual(['constant', 'null', 'date', 'runjs']);

    const dateNode = tree[2];
    expect(dateNode.selectable).toBe(false);
    expect((dateNode.children as MetaTreeNode[]).map((node) => node.name)).toEqual([
      'exact',
      'past',
      'next',
      'now',
      'today',
      'yesterday',
      'tomorrow',
      'thisWeek',
      'lastWeek',
      'nextWeek',
      'thisMonth',
      'lastMonth',
      'nextMonth',
      'thisQuarter',
      'lastQuarter',
      'nextQuarter',
      'thisYear',
      'lastYear',
      'nextYear',
    ]);
    expect(tree[4].name).toBe('currentUser');
  });

  it('does not allow Now for pure date fields', async () => {
    const dateComponentProps: DateVariableComponentProps = {
      ...DEFAULT_DATE_VARIABLE_COMPONENT_PROPS,
      exactNormalizeMode: 'date',
    };
    renderInput({ isDateLikeField: true, dateComponentProps });

    const tree = await resolveMetaTree();
    const dateNode = tree[2];
    expect((dateNode.children as MetaTreeNode[]).map((node) => node.name)).not.toContain('now');
    expect(
      mocks.variableInputProps?.converters?.resolveValueFromPath?.({
        name: 'now',
        title: 'Now',
        type: 'date',
        paths: ['date', 'now'],
      }),
    ).toBeUndefined();
  });

  it('restores a legacy Now value for a pure date field without allowing it to be selected again', async () => {
    const dateComponentProps: DateVariableComponentProps = {
      ...DEFAULT_DATE_VARIABLE_COMPONENT_PROPS,
      exactNormalizeMode: 'date',
    };
    renderInput({ value: '{{ ctx.date.preset.now }}', isDateLikeField: true, dateComponentProps });

    const tree = await resolveMetaTree();
    const dateNode = tree[2];
    const nowNode = (dateNode.children as MetaTreeNode[]).find((node) => node.name === 'now');
    expect(nowNode).toMatchObject({ disabled: true, selectable: false });
    expect(mocks.variableInputProps?.converters?.resolvePathFromValue?.(mocks.variableInputProps.value)).toEqual([
      'date',
      'now',
    ]);
  });

  it('restores legacy date expressions under Date without changing Constant semantics', () => {
    renderInput({ value: '{{ ctx.date.preset.today }}', isDateLikeField: true });

    expect(mocks.variableInputProps?.value).toMatchObject({ kind: 'preset', preset: 'today' });
    expect(mocks.variableInputProps?.converters?.resolvePathFromValue?.(mocks.variableInputProps.value)).toEqual([
      'date',
      'today',
    ]);
    expect(
      mocks.variableInputProps?.converters?.resolveValueFromPath?.({
        name: 'constant',
        title: 'Constant',
        type: 'string',
        paths: ['constant'],
      }),
    ).toBe('');
  });

  it.each([
    { kind: 'exact', value: 'plain JSON value' },
    { kind: 'relative', direction: 'next', amount: 1, unit: 'day' },
    { kind: 'preset', preset: 'today' },
  ])('keeps a JSON constant containing Date-like keys as a constant', (constantValue) => {
    const onChange = renderInput({ value: constantValue, isDateLikeField: false });

    expect(mocks.variableInputProps?.converters?.resolvePathFromValue?.(mocks.variableInputProps.value)).toEqual([
      'constant',
    ]);
    mocks.variableInputProps?.onChange?.(constantValue);
    expect(onChange).toHaveBeenCalledWith(constantValue);
  });

  it.each(['exact', 'past', 'next', 'today'])(
    'initializes %s as a complete formatted expression for a non-date field',
    (nodeName) => {
      const onChange = renderInput({ isDateLikeField: false });
      const initial = mocks.variableInputProps?.converters?.resolveValueFromPath?.({
        name: nodeName,
        title: nodeName,
        type: 'date',
        paths: ['date', nodeName],
      });

      mocks.variableInputProps?.onChange?.(initial);

      const stored = onChange.mock.calls[0]?.[0];
      const parsed = parseCtxDateExpressionConfig(stored);
      expect(parsed).toBeDefined();
      expect(parsed?.format).toBe('YYYY-MM-DD');
    },
  );

  it('uses a datetime default Format for Now and restores a custom Format without emitting a change', () => {
    const onChange = renderInput({ isDateLikeField: false });
    const initial = mocks.variableInputProps?.converters?.resolveValueFromPath?.({
      name: 'now',
      title: 'Now',
      type: 'date',
      paths: ['date', 'now'],
    });

    mocks.variableInputProps?.onChange?.(initial);
    expect(parseCtxDateExpressionConfig(onChange.mock.calls[0]?.[0])?.format).toBe('YYYY-MM-DD HH:mm:ss');

    const customExpression = serializeCtxDateExpressionConfig({
      kind: 'preset',
      preset: 'today',
      format: 'YYYY/MM/DD',
    });
    if (!customExpression) throw new Error('Expected a formatted Date expression');
    const customOnChange = renderInput({ value: customExpression, isDateLikeField: false });

    mocks.variableInputProps?.onChange?.(mocks.variableInputProps.value);
    expect(mocks.variableInputProps?.value).toMatchObject({ kind: 'preset', preset: 'today', format: 'YYYY/MM/DD' });
    expect(customOnChange).not.toHaveBeenCalled();
  });

  it('does not add the default Format while restoring a legacy expression for a non-date field', () => {
    const onChange = renderInput({ value: '{{ ctx.date.preset.today }}', isDateLikeField: false });

    mocks.variableInputProps?.onChange?.(mocks.variableInputProps.value);

    expect(onChange).not.toHaveBeenCalled();
  });

  it('keeps date-like field expressions unformatted', () => {
    const onChange = renderInput({ isDateLikeField: true });
    const initial = mocks.variableInputProps?.converters?.resolveValueFromPath?.({
      name: 'today',
      title: 'Today',
      type: 'date',
      paths: ['date', 'today'],
    });

    mocks.variableInputProps?.onChange?.(initial);

    expect(parseCtxDateExpressionConfig(onChange.mock.calls[0]?.[0])).toEqual({
      kind: 'preset',
      preset: 'today',
    });

    const formattedExpression = serializeCtxDateExpressionConfig({
      kind: 'preset',
      preset: 'today',
      format: 'YYYY/MM/DD',
    });
    if (!formattedExpression) throw new Error('Expected a formatted Date expression');
    const formattedOnChange = renderInput({ value: formattedExpression, isDateLikeField: true });

    mocks.variableInputProps?.onChange?.(mocks.variableInputProps.value);
    expect(mocks.variableInputProps?.value).toMatchObject({ kind: 'preset', preset: 'today', format: 'YYYY/MM/DD' });
    expect(formattedOnChange).not.toHaveBeenCalled();
  });

  it('preserves spaces while editing a custom Format', () => {
    const expression = serializeCtxDateExpressionConfig({
      kind: 'preset',
      preset: 'today',
      format: 'YYYY-MM-DD',
    });
    if (!expression) throw new Error('Expected a formatted Date expression');
    const onChange = renderInput({ value: expression, isDateLikeField: false });
    const DateEditor = mocks.variableInputProps?.converters?.renderInputComponent?.({
      name: 'today',
      title: 'Today',
      type: 'date',
      paths: ['date', 'today'],
    });
    if (!DateEditor) throw new Error('Expected the Date editor');

    render(<DateEditor value={mocks.variableInputProps?.value} onChange={mocks.variableInputProps?.onChange} />);
    fireEvent.change(screen.getByRole('combobox', { name: 'Format' }), {
      target: { value: 'YYYY-MM-DD ' },
    });

    expect(parseCtxDateExpressionConfig(onChange.mock.calls[0]?.[0])?.format).toBe('YYYY-MM-DD ');
  });
});

describe('DateVariableEditor Format', () => {
  it('stores date-only picker values without converting them to a timezone-dependent ISO instant', () => {
    expect(serializeExactDatePickerValue(dayjs('2026-02-12'), false)).toBe('2026-02-12');
    expect(serializeExactDatePickerValue([dayjs('2026-02-12'), dayjs('2026-02-20')], false)).toEqual([
      '2026-02-12',
      '2026-02-20',
    ]);
  });

  it('shows Format for non-date fields', () => {
    render(
      <DateVariableEditor
        value={{ kind: 'preset', preset: 'today' }}
        isDateLikeField={false}
        dateComponentProps={DEFAULT_DATE_VARIABLE_COMPONENT_PROPS}
      />,
    );

    expect(screen.getByRole('combobox', { name: 'Format' })).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'Preview' })).not.toBeInTheDocument();
  });

  it('keeps the relative amount visible beside its fixed-width unit selector', () => {
    render(
      <DateVariableEditor
        value={{ kind: 'relative', direction: 'next', amount: 1, unit: 'day' }}
        isDateLikeField={false}
        dateComponentProps={DEFAULT_DATE_VARIABLE_COMPONENT_PROPS}
      />,
    );

    const amountInput = screen.getByRole('spinbutton', { name: 'Next' });
    expect(amountInput).toHaveValue('1');
    expect(amountInput.closest('.ant-input-number')).toHaveStyle({ minWidth: '80px' });
    expect(screen.getByRole('combobox', { name: 'Unit' }).closest('.ant-select')).toHaveStyle({ flex: '0 0 130px' });
  });

  it('shows the default Format as a placeholder when a legacy expression has no Format', () => {
    render(
      <DateVariableEditor
        value={{ kind: 'preset', preset: 'now' }}
        isDateLikeField={false}
        dateComponentProps={DEFAULT_DATE_VARIABLE_COMPONENT_PROPS}
      />,
    );

    const formatInput = screen.getByRole('combobox', { name: 'Format' });
    expect(formatInput).toHaveValue('');
    expect(screen.getByText('YYYY-MM-DD HH:mm:ss')).toHaveClass('ant-select-selection-placeholder');
  });

  it('hides Format for date-like fields', () => {
    render(
      <DateVariableEditor
        value={{ kind: 'preset', preset: 'today' }}
        isDateLikeField
        dateComponentProps={DEFAULT_DATE_VARIABLE_COMPONENT_PROPS}
      />,
    );

    expect(screen.queryByRole('combobox', { name: 'Format' })).not.toBeInTheDocument();
  });
});

describe('date-like field detection', () => {
  it('treats dateOnly interface and type as pure date fields', () => {
    expect(isDateLikeField({ interface: 'dateOnly' })).toBe(true);
    expect(isDateLikeField({ type: 'dateOnly' })).toBe(true);
    expect(resolveDateVariableComponentProps({ interface: 'dateOnly' })).toMatchObject({
      showTime: false,
      exactNormalizeMode: 'date',
    });
    expect(resolveDateVariableComponentProps({ type: 'dateOnly' })).toMatchObject({
      showTime: false,
      exactNormalizeMode: 'date',
    });
    expect(
      resolveDateVariableComponentProps({
        interface: 'dateOnly',
        getComponentProps: () => ({ showTime: true, format: 'YYYY-MM-DD HH:mm:ss' }),
      }),
    ).toMatchObject({
      showTime: false,
      format: 'YYYY-MM-DD',
      exactNormalizeMode: 'date',
    });
  });

  it('uses the resolved fallback interface when the preferred field metadata omits it', () => {
    expect(isDateLikeField({}, 'scheduledAt', 'datetime')).toBe(true);
  });
});
