/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * v2-native copy of the v1 `CalculationConfig` (mirrors `client/components/
 * Calculation.tsx`). Same recursive boolean-condition builder, same
 * `calculators` registry and stored shape — but Formily-free:
 *   - `css`/`cx` from `@emotion/css` (not `@nocobase/client`)
 *   - label compilation through the v2 `useT()` (not `useCompile`)
 *   - operands use the core `TypedVariableInput` (constant-or-variable) fed the
 *     workflow variable MetaTree, replacing v1's `Variable.Input` +
 *     `useTypedConstant` + `scope`
 *
 * The `useVariableHook` injection point is preserved (v1 parity) so a caller can
 * supply a different workflow-variable source; it now returns `MetaTreeNode[]`.
 */

import { CloseCircleOutlined } from '@ant-design/icons';
import { css, cx } from '@emotion/css';
import { TypedVariableInput, type TypedConstantSpec } from '@nocobase/client-v2';
import type { MetaTreeNode } from '@nocobase/flow-engine';
import { Registry } from '@nocobase/utils/client';
import { Button, ConfigProvider, Select } from 'antd';
import React, { createContext, useCallback, useContext } from 'react';
import { Trans } from 'react-i18next';
import { useT, useWorkflowTranslation, NAMESPACE } from '../locale';
import { useWorkflowVariableOptions } from '../canvas/useWorkflowVariableOptions';
import { WORKFLOW_TYPED_CONSTANT_TYPES } from '../canvas/WorkflowTypedVariableInput';

const OPERAND_TYPES: TypedConstantSpec[] = WORKFLOW_TYPED_CONSTANT_TYPES;

// v1 relied on a global FormItem `.auto-width` rule to shrink the operator Select to its content; v2 has no such global
// rule, so scope it locally (same pattern as the core `FileSizeInput`). Without this the antd Select defaults to
// `width: 100%` and swallows the whole row, collapsing the operands.
const operatorWidthClassName = css`
  &.ant-select {
    width: auto;
    min-width: 6em;
    flex-shrink: 0;
  }
`;

// `TypedVariableInput` is full-width by default (`<div style={{ width: '100%' }}>` +
// `Space.Compact style={{ display: 'flex', width: '100%' }}`), which works for
// form rows but not for the v1-style calculation builder. Here we locally
// restore the old intrinsic-width behavior so the row stays on one line by
// default, yet can wrap when a selected variable path becomes too long.
const operandClassName = css`
  flex: 0 1 auto;
  min-width: 12em;
  max-width: 100%;

  > div {
    width: auto !important;
    max-width: 100%;
  }

  > div > .ant-space-compact {
    display: inline-flex !important;
    width: auto !important;
    max-width: 100%;
  }
`;

interface Calculator {
  name: string;
  type: 'boolean' | 'number' | 'string' | 'date' | 'unknown' | 'null' | 'array';
  group: string;
}

export const calculators = new Registry<Calculator>();

calculators.register('equal', { name: '=', type: 'boolean', group: 'boolean' });
calculators.register('notEqual', { name: '≠', type: 'boolean', group: 'boolean' });
calculators.register('gt', { name: '>', type: 'boolean', group: 'boolean' });
calculators.register('gte', { name: '≥', type: 'boolean', group: 'boolean' });
calculators.register('lt', { name: '<', type: 'boolean', group: 'boolean' });
calculators.register('lte', { name: '≤', type: 'boolean', group: 'boolean' });

calculators.register('includes', { name: '{{t("contains")}}', type: 'boolean', group: 'string' });
calculators.register('notIncludes', { name: '{{t("does not contain")}}', type: 'boolean', group: 'string' });
calculators.register('startsWith', { name: '{{t("starts with")}}', type: 'boolean', group: 'string' });
calculators.register('notStartsWith', { name: '{{t("not starts with")}}', type: 'boolean', group: 'string' });
calculators.register('endsWith', { name: '{{t("ends with")}}', type: 'boolean', group: 'string' });
calculators.register('notEndsWith', { name: '{{t("not ends with")}}', type: 'boolean', group: 'string' });

const calculatorGroups = [
  { value: 'boolean', title: '{{t("Comparision")}}' },
  { value: 'number', title: `{{t("Arithmetic calculation", { ns: "${NAMESPACE}" })}}` },
  { value: 'string', title: `{{t("String operation", { ns: "${NAMESPACE}" })}}` },
  { value: 'date', title: `{{t("Date", { ns: "${NAMESPACE}" })}}` },
];

function getGroupCalculators(group: string) {
  return Array.from(calculators.getEntities()).filter(([, value]) => value.group === group);
}

const VariableHookContext = createContext<() => MetaTreeNode[]>(useWorkflowVariableOptions);

function useOperandMetaTree(): MetaTreeNode[] {
  const useVariableHook = useContext(VariableHookContext);
  return useVariableHook();
}

function Calculation({ calculator, operands = [], onChange }: any) {
  const compile = useT();
  const { componentDisabled } = ConfigProvider.useConfig();
  const disabled = Boolean(componentDisabled);
  // Keep the left/right operands on separate meta-tree instances. `TypedVariableInput`
  // lazily resolves relation children by mutating its `metaTree` in place; sharing one
  // tree between both sides can leave the other cascader stuck on a stale loading column
  // when both operands walk the same workflow-variable branch.
  const leftMetaTree = useOperandMetaTree();
  const rightMetaTree = useOperandMetaTree();
  const leftOperandOnChange = useCallback(
    (v: unknown) => onChange({ calculator, operands: [v, operands[1]] }),
    [calculator, onChange, operands],
  );
  const rightOperandOnChange = useCallback(
    (v: unknown) => onChange({ calculator, operands: [operands[0], v] }),
    [calculator, onChange, operands],
  );
  const operatorOnChange = useCallback((v: string) => onChange({ operands, calculator: v }), [onChange, operands]);

  return (
    <fieldset
      className={css`
        display: flex;
        gap: 0.5em;
        align-items: center;
        flex-wrap: wrap;
        margin: 0;
        padding: 0;
        border: none;
      `}
    >
      <div className={operandClassName} data-testid="calculation-operand">
        <TypedVariableInput
          types={OPERAND_TYPES}
          metaTree={leftMetaTree}
          value={operands[0]}
          onChange={leftOperandOnChange}
          disabled={disabled}
        />
      </div>
      <Select
        // antd's Select prop type doesn't surface DOM passthrough props (`role`), though it forwards them — same as the
        // core `CollectionSelectorFieldModel`.
        // @ts-expect-error -- role is forwarded to the DOM node
        role="button"
        aria-label="select-operator-calc"
        value={calculator}
        onChange={operatorOnChange}
        placeholder={compile('Operator')}
        popupMatchSelectWidth={false}
        className={operatorWidthClassName}
      >
        {calculatorGroups
          .filter((group) => Boolean(getGroupCalculators(group.value).length))
          .map((group) => (
            <Select.OptGroup key={group.value} label={compile(group.title)}>
              {getGroupCalculators(group.value).map(([value, { name }]) => (
                <Select.Option key={value} value={value}>
                  {compile(name)}
                </Select.Option>
              ))}
            </Select.OptGroup>
          ))}
      </Select>
      <div className={operandClassName} data-testid="calculation-operand">
        <TypedVariableInput
          types={OPERAND_TYPES}
          metaTree={rightMetaTree}
          value={operands[1]}
          onChange={rightOperandOnChange}
          disabled={disabled}
        />
      </div>
    </fieldset>
  );
}

function CalculationItem({ value, onChange, onRemove }: any) {
  if (!value) {
    return null;
  }

  const { calculator, operands = [] } = value;

  return (
    <div
      className={css`
        display: flex;
        position: relative;
        margin: 0.5em 0;
      `}
    >
      {value.group ? (
        <CalculationGroup value={value.group} onChange={(group: any) => onChange({ ...value, group })} />
      ) : (
        <Calculation operands={operands} calculator={calculator} onChange={onChange} />
      )}
      <Button aria-label="icon-close" onClick={onRemove} type="link" icon={<CloseCircleOutlined />} />
    </div>
  );
}

function CalculationGroup({ value, onChange }: any) {
  const t = useT();
  // The "Meet [All/Any] conditions in the group" sentence is a composite `<Trans>` key that lives in the core `client`
  // namespace (not workflow's), so it needs the fallback-aware translator — same as v1's bare `useTranslation()`.
  const { t: tt } = useWorkflowTranslation();
  const { type = 'and', calculations = [] } = value;

  const onAddSingle = useCallback(() => {
    onChange({
      ...value,
      calculations: [...calculations, { not: false, calculator: 'equal' }],
    });
  }, [value, calculations, onChange]);

  const onAddGroup = useCallback(() => {
    onChange({
      ...value,
      calculations: [...calculations, { not: false, group: { type: 'and', calculations: [] } }],
    });
  }, [value, calculations, onChange]);

  const onRemove = useCallback(
    (i: number) => {
      calculations.splice(i, 1);
      onChange({ ...value, calculations: [...calculations] });
    },
    [value, calculations, onChange],
  );

  const onItemChange = useCallback(
    (i: number, v: any) => {
      calculations.splice(i, 1, v);
      onChange({ ...value, calculations: [...calculations] });
    },
    [value, calculations, onChange],
  );

  return (
    <div
      className={cx(
        'node-type-condition-group',
        css`
          position: relative;
          width: 100%;
          .node-type-condition-group {
            padding: 0.5em 1em;
            border: 1px dashed #ddd;
          }
          + button {
            position: absolute;
            right: 0;
          }
        `,
      )}
    >
      <div
        className={css`
          display: flex;
          align-items: center;
          gap: 0.5em;
          .ant-select {
            width: auto;
            min-width: 6em;
          }
        `}
      >
        <Trans t={tt}>
          {'Meet '}
          <Select
            // antd's Select prop type doesn't surface DOM passthrough props (`role`/`data-testid`), though it forwards
            // them — same as the core `CollectionSelectorFieldModel`.
            // @ts-expect-error -- role/data-testid are forwarded to the DOM node
            role="button"
            data-testid="filter-select-all-or-any"
            value={type}
            onChange={(t) => onChange({ ...value, type: t })}
          >
            <Select.Option value="and">All</Select.Option>
            <Select.Option value="or">Any</Select.Option>
          </Select>
          {' conditions in the group'}
        </Trans>
      </div>
      <div className="calculation-items">
        {calculations.map((calculation: any, i: number) => (
          <CalculationItem
            key={`${calculation.calculator}_${i}`}
            value={calculation}
            onChange={onItemChange.bind(null, i)}
            onRemove={() => onRemove(i)}
          />
        ))}
      </div>
      <div
        className={css`
          button {
            padding: 0;
            &:not(:last-child) {
              margin-right: 1em;
            }
          }
        `}
      >
        <Button type="link" onClick={onAddSingle}>
          {t('Add condition')}
        </Button>
        <Button type="link" onClick={onAddGroup}>
          {t('Add condition group')}
        </Button>
      </div>
    </div>
  );
}

export interface CalculationConfigProps {
  value?: any;
  onChange?: (value: any) => void;
  useVariableHook?: () => MetaTreeNode[];
}

export function CalculationConfig({
  value,
  onChange,
  useVariableHook = useWorkflowVariableOptions,
}: CalculationConfigProps) {
  const rule = value && Object.keys(value).length ? value : { group: { type: 'and', calculations: [] } };
  return (
    <VariableHookContext.Provider value={useVariableHook}>
      <CalculationGroup value={rule.group} onChange={(group: any) => onChange?.({ ...rule, group })} />
    </VariableHookContext.Provider>
  );
}

export default CalculationConfig;
