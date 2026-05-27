/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DrawerFormLayout, useCurrentAppInfo } from '@nocobase/client-v2';
import { randomId, useFlowContext } from '@nocobase/flow-engine';
import { getPickerFormat } from '@nocobase/utils/client';
import { DeleteOutlined, DownOutlined, MenuOutlined, PlusOutlined } from '@ant-design/icons';
import { closestCenter, DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent, DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Button,
  Checkbox,
  ColorPicker,
  DatePicker,
  Dropdown,
  Form,
  Input,
  InputNumber,
  Radio,
  Select,
  Space,
  Table,
  Tag,
  TimePicker,
} from 'antd';
import type { MenuProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { cloneDeep, get, set } from 'lodash';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useT } from '../../locale';
import { PluginDataSourceManagerClientV2 } from '../../plugin';
import { compileLegacyTemplate, compileLegacyTemplateText } from '../../utils/compileLegacyTemplate';
import { getCollectionFieldActionUrl } from './collectionFieldApi';
import { filterFieldInterfacesByCollectionTemplate } from './collectionTemplateFieldInterfaces';

interface FieldFormProps {
  mode: 'create' | 'edit';
  dataSourceKey: string;
  collection: Record<string, any>;
  interfaceName?: string;
  field?: Record<string, any>;
  onSubmitted: () => void;
}

interface FieldInterfaceManagerWithConfigure {
  getFieldInterfaceConfigureProperties?: (name: string, collectionInfo?: Record<string, any>) => Record<string, any>;
  getFieldInterfaceConfigure?: (name: string, collectionInfo?: Record<string, any>) => Record<string, any> | undefined;
}

function getFieldInterfaces(ctx: any, dataSourceType?: string) {
  return ctx.dataSourceManager.collectionFieldInterfaceManager?.getFieldInterfaces?.(dataSourceType) || [];
}

function getFieldInterfaceManager(ctx: any) {
  return ctx.dataSourceManager.collectionFieldInterfaceManager as FieldInterfaceManagerWithConfigure | undefined;
}

function filterFieldInterfacesByTemplate(
  fieldInterfaces: Array<Record<string, any>>,
  collection: Record<string, any>,
  ctx: any,
  mode: 'create' | 'edit',
  databaseDialect?: string,
) {
  if (mode !== 'create') {
    return fieldInterfaces;
  }
  const plugin = ctx.app.pm.get(PluginDataSourceManagerClientV2);
  const template = plugin?.getCollectionTemplate?.(collection.template || 'general');
  return filterFieldInterfacesByCollectionTemplate(fieldInterfaces, template, collection, { databaseDialect });
}

function normalizeListResponse(response: any) {
  const payload = response?.data?.data;
  if (Array.isArray(payload)) {
    return payload;
  }
  return Array.isArray(payload?.data) ? payload.data : [];
}

function toNamePath(name: string) {
  return name.split('.');
}

const commonPropertyNames = new Set(['name', 'uiSchema.title']);
const fieldNamePattern = /^[a-zA-Z][a-zA-Z0-9_-]*$/;
const fieldNameDescription =
  'Randomly generated and can be modified. Support letters, numbers and underscores, must start with an letter.';
const layoutComponents = new Set(['Grid', 'Grid.Row', 'Grid.Col', 'div']);
const collectionOptionComponents = new Set(['Select', 'CollectionSelect', 'RemoteSelect']);
const relationCollectionPropertyNames = new Set(['target']);
const fileCollectionEnum = '{{fileCollections}}';
const sourceKeyPropertyNames = new Set(['sourceKey']);
const targetKeyPropertyNames = new Set(['targetKey']);
const optionColorOptions = ['red', 'orange', 'gold', 'green', 'cyan', 'blue', 'purple', 'magenta', 'default'].map(
  (value) => ({
    value,
    label: value,
  }),
);
const REQUIRED_RULE_KEY = 'required';
const defaultValidationRules = [{ key: REQUIRED_RULE_KEY, label: 'Required', hasValue: false, params: [] }];
type SortableOptionRowProps = React.HTMLAttributes<HTMLTableRowElement> & {
  'data-row-key': string;
};

const SortableOptionRowContext = React.createContext<{
  attributes?: DraggableAttributes;
  listeners?: DraggableSyntheticListeners;
  setActivatorNodeRef?: (node: HTMLElement | null) => void;
} | null>(null);

function SortableOptionRow(props: SortableOptionRowProps) {
  const id = String(props['data-row-key']);
  const { attributes, isDragging, listeners, setActivatorNodeRef, setNodeRef, transform, transition } = useSortable({
    id,
  });
  const style = {
    ...props.style,
    transform: CSS.Transform.toString(transform),
    transition,
    ...(isDragging ? { position: 'relative' as const, zIndex: 1 } : null),
  };

  return (
    <SortableOptionRowContext.Provider value={{ attributes, listeners, setActivatorNodeRef }}>
      <tr ref={setNodeRef} {...props} style={style} />
    </SortableOptionRowContext.Provider>
  );
}

function OptionSortHandle(props: { disabled?: boolean }) {
  const dragContext = React.useContext(SortableOptionRowContext);

  return (
    <span
      ref={props.disabled ? undefined : dragContext?.setActivatorNodeRef}
      {...(props.disabled ? {} : dragContext?.attributes)}
      {...(props.disabled ? {} : dragContext?.listeners)}
      style={{
        alignItems: 'center',
        color: 'var(--ant-color-text-tertiary)',
        cursor: props.disabled ? 'not-allowed' : 'grab',
        display: 'inline-flex',
      }}
    >
      <MenuOutlined />
    </span>
  );
}

const fieldValidationOptions: Record<string, Array<Record<string, any>>> = {
  string: [
    ...defaultValidationRules,
    {
      key: 'max',
      label: 'Max length',
      hasValue: true,
      params: [{ key: 'limit', label: 'Limit', componentType: 'inputNumber', required: true }],
    },
    {
      key: 'min',
      label: 'Min length',
      hasValue: true,
      params: [{ key: 'limit', label: 'Limit', componentType: 'inputNumber', required: true }],
    },
    {
      key: 'pattern',
      label: 'Pattern',
      hasValue: true,
      params: [{ key: 'regex', label: 'Regular Expression', componentType: 'text', required: true }],
    },
    { key: 'email', label: 'Email', hasValue: false, params: [], paramsType: 'object' },
    { key: 'uuid', label: 'UUID', hasValue: false, params: [], paramsType: 'object' },
    {
      key: 'length',
      label: 'Length',
      hasValue: true,
      params: [{ key: 'limit', label: 'Limit', componentType: 'inputNumber', required: true }],
    },
    { key: 'uri', label: 'URI', hasValue: false, params: [], paramsType: 'object' },
  ],
  number: [
    ...defaultValidationRules,
    {
      key: 'greater',
      label: 'Greater than',
      hasValue: true,
      params: [{ key: 'limit', label: 'Limit', componentType: 'inputNumber', required: true }],
    },
    {
      key: 'less',
      label: 'Less than',
      hasValue: true,
      params: [{ key: 'limit', label: 'Limit', componentType: 'inputNumber', required: true }],
    },
    {
      key: 'max',
      label: 'Max value',
      hasValue: true,
      params: [{ key: 'limit', label: 'Limit', componentType: 'inputNumber', required: true }],
    },
    {
      key: 'min',
      label: 'Min value',
      hasValue: true,
      params: [{ key: 'limit', label: 'Limit', componentType: 'inputNumber', required: true }],
    },
    {
      key: 'multiple',
      label: 'Multiple',
      hasValue: true,
      params: [{ key: 'base', label: 'Base', componentType: 'inputNumber', required: true }],
    },
    { key: 'integer', label: 'Integer', hasValue: false, params: [] },
    {
      key: 'precision',
      label: 'Precision',
      hasValue: true,
      params: [{ key: 'limit', label: 'Limit', componentType: 'inputNumber', required: true }],
    },
    { key: 'unsafe', label: 'Unsafe integer', hasValue: false, params: [] },
  ],
  date: [
    ...defaultValidationRules,
    {
      key: 'greater',
      label: 'Greater than',
      hasValue: true,
      params: [{ key: 'date', label: 'Date', componentType: 'datePicker', required: true }],
    },
    {
      key: 'less',
      label: 'Less than',
      hasValue: true,
      params: [{ key: 'date', label: 'Date', componentType: 'datePicker', required: true }],
    },
    {
      key: 'max',
      label: 'Max value',
      hasValue: true,
      params: [{ key: 'date', label: 'Date', componentType: 'datePicker', required: true }],
    },
    {
      key: 'min',
      label: 'Min value',
      hasValue: true,
      params: [{ key: 'date', label: 'Date', componentType: 'datePicker', required: true }],
    },
    {
      key: 'timestamp',
      label: 'Timestamp',
      hasValue: true,
      params: [
        {
          key: 'type',
          label: 'Type',
          componentType: 'singleSelect',
          options: [
            { label: 'JavaScript', value: 'javascript' },
            { label: 'Unix', value: 'unix' },
          ],
          defaultValue: 'javascript',
        },
      ],
    },
  ],
  object: defaultValidationRules,
};

function isTruthyExpression(value: unknown, context: Record<string, boolean>) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value !== 'string') {
    return false;
  }

  const expression = value.replace(/^\s*\{\{\s*/, '').replace(/\s*\}\}\s*$/, '');
  const evaluateToken = (token: string) => {
    const trimmed = token.trim().replace(/^\$/, '');
    if (!trimmed) {
      return false;
    }
    if (trimmed.startsWith('!')) {
      return !context[trimmed.slice(1).trim().replace(/^\$?/, '')];
    }
    return !!context[trimmed];
  };

  return expression.split('||').some((orPart) => orPart.split('&&').every((andPart) => evaluateToken(andPart)));
}

type LegacyReactionState = {
  componentProps?: Record<string, any>;
  dataSource?: unknown;
  description?: React.ReactNode;
  disabled?: boolean;
  hidden?: boolean;
  value?: unknown;
  hasValue?: boolean;
};

type LegacyReactionContext = {
  context: Record<string, boolean>;
  currentName: string;
  deps: unknown[];
  selfValue: unknown;
  t: (key: string) => string;
};

function normalizeLegacyReactions(reactions: unknown): Array<Record<string, any>> {
  if (!reactions) {
    return [];
  }

  return (Array.isArray(reactions) ? reactions : [reactions]).filter(
    (reaction): reaction is Record<string, any> => typeof reaction === 'object' && reaction !== null,
  );
}

function getLegacyReactionDependencies(schema: Record<string, any>) {
  return Array.from(
    new Set(
      normalizeLegacyReactions(schema?.['x-reactions'])
        .flatMap((reaction) => reaction.dependencies || [])
        .filter((name): name is string => typeof name === 'string'),
    ),
  );
}

function resolveLegacyDependencyValue(dependency: string, currentName: string, values: Record<string, any>) {
  if (dependency.startsWith('.')) {
    const parentPath = currentName.split('.').slice(0, -1);
    return get(values, [...parentPath, dependency.slice(1)]);
  }

  return get(values, dependency);
}

function unwrapLegacyExpression(value: string) {
  return value
    .replace(/^\s*\{\{\s*/, '')
    .replace(/\s*\}\}\s*$/, '')
    .trim();
}

function parseLegacyLiteral(value: string) {
  const trimmed = value.trim();
  if (trimmed === 'true') {
    return true;
  }
  if (trimmed === 'false') {
    return false;
  }
  if (trimmed === 'null') {
    return null;
  }
  if (trimmed === 'undefined') {
    return undefined;
  }

  const stringMatch = trimmed.match(/^(['"])([\s\S]*)\1$/);
  if (stringMatch) {
    return stringMatch[2];
  }

  const numberValue = Number(trimmed);
  return Number.isNaN(numberValue) ? trimmed : numberValue;
}

function evaluateLegacyBooleanExpression(expression: string, context: LegacyReactionContext): boolean {
  const trimmed = expression.trim();
  if (trimmed.includes('&&')) {
    return trimmed.split('&&').every((item) => evaluateLegacyBooleanExpression(item, context));
  }
  if (trimmed.includes('||')) {
    return trimmed.split('||').some((item) => evaluateLegacyBooleanExpression(item, context));
  }
  if (trimmed.startsWith('!!')) {
    return !!evaluateLegacyExpression(trimmed.slice(2), context);
  }
  if (trimmed.startsWith('!')) {
    return !evaluateLegacyBooleanExpression(trimmed.slice(1), context);
  }

  return !!evaluateLegacyExpression(trimmed, context);
}

function evaluateLegacyExpression(source: unknown, context: LegacyReactionContext): unknown {
  if (typeof source !== 'string') {
    return source;
  }

  const expression = unwrapLegacyExpression(source);
  const depsMatch = expression.match(/^\$deps\[(\d+)\]$/);
  if (depsMatch) {
    return context.deps[Number(depsMatch[1])];
  }

  if (expression === '$self.value') {
    return context.selfValue;
  }

  const contextMatch = expression.match(/^!?[a-zA-Z][a-zA-Z0-9_]*$/);
  if (contextMatch) {
    const negated = expression.startsWith('!');
    const key = negated ? expression.slice(1) : expression;
    return negated ? !context.context[key] : !!context.context[key];
  }

  const arrayIncludesTernaryMatch = expression.match(
    /^\[([^\]]+)\]\.includes\(\$deps\[(\d+)\]\)\s*\?\s*(.+?)\s*:\s*(.+)$/,
  );
  if (arrayIncludesTernaryMatch) {
    const values = arrayIncludesTernaryMatch[1]
      .split(',')
      .map((item) => parseLegacyLiteral(item))
      .filter((item) => typeof item === 'string');
    return values.includes(context.deps[Number(arrayIncludesTernaryMatch[2])] as string)
      ? parseLegacyLiteral(arrayIncludesTernaryMatch[3])
      : parseLegacyLiteral(arrayIncludesTernaryMatch[4]);
  }

  const equalityTernaryMatch = expression.match(/^\$deps\[(\d+)\]\s*(={2,3}|!={1,2})\s*(.+?)\s*\?\s*(.+?)\s*:\s*(.+)$/);
  if (equalityTernaryMatch) {
    const left = context.deps[Number(equalityTernaryMatch[1])];
    const right = parseLegacyLiteral(equalityTernaryMatch[3]);
    const matched = equalityTernaryMatch[2].startsWith('!') ? left !== right : left === right;
    return matched ? parseLegacyLiteral(equalityTernaryMatch[4]) : parseLegacyLiteral(equalityTernaryMatch[5]);
  }

  const equalityMatch = expression.match(/^\$deps\[(\d+)\]\s*(={2,3}|!={1,2})\s*(.+)$/);
  if (equalityMatch) {
    const left = context.deps[Number(equalityMatch[1])];
    const right = parseLegacyLiteral(equalityMatch[3]);
    return equalityMatch[2].startsWith('!') ? left !== right : left === right;
  }

  const depTernaryTranslateMatch = expression.match(/^\$deps\[(\d+)\]\s*\?\s*t\((['"])(.*?)\2\)\s*:\s*(.+)$/);
  if (depTernaryTranslateMatch) {
    return context.deps[Number(depTernaryTranslateMatch[1])]
      ? context.t(depTernaryTranslateMatch[3])
      : parseLegacyLiteral(depTernaryTranslateMatch[4]);
  }

  const depTernaryMatch = expression.match(/^\$deps\[(\d+)\]\s*\?\s*(.+?)\s*:\s*(.+)$/);
  if (depTernaryMatch) {
    return context.deps[Number(depTernaryMatch[1])]
      ? parseLegacyLiteral(depTernaryMatch[2])
      : parseLegacyLiteral(depTernaryMatch[3]);
  }

  const getPickerFormatMatch = expression.match(/^getPickerFormat\(\$deps\[(\d+)\]\)$/);
  if (getPickerFormatMatch) {
    return getPickerFormat(context.deps[Number(getPickerFormatMatch[1])] as string);
  }

  return parseLegacyLiteral(expression);
}

function evaluateLegacyObjectExpressions(value: unknown, context: LegacyReactionContext): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => evaluateLegacyObjectExpressions(item, context));
  }
  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, evaluateLegacyObjectExpressions(item, context)]),
    );
  }
  return evaluateLegacyExpression(value, context);
}

function mergeLegacyReactionState(
  state: LegacyReactionState,
  rawState: Record<string, any> | undefined,
  rawSchema: Record<string, any> | undefined,
  context: LegacyReactionContext,
) {
  if (!rawState && !rawSchema) {
    return;
  }

  if (rawState) {
    if ('hidden' in rawState) {
      state.hidden =
        typeof rawState.hidden === 'string'
          ? evaluateLegacyBooleanExpression(unwrapLegacyExpression(rawState.hidden), context)
          : !!evaluateLegacyExpression(rawState.hidden, context);
    }
    if ('visible' in rawState) {
      state.hidden =
        typeof rawState.visible === 'string'
          ? !evaluateLegacyBooleanExpression(unwrapLegacyExpression(rawState.visible), context)
          : !evaluateLegacyExpression(rawState.visible, context);
    }
    if ('display' in rawState) {
      const display = evaluateLegacyExpression(rawState.display, context);
      state.hidden = display === 'none' || display === 'hidden';
    }
    if ('disabled' in rawState) {
      state.disabled =
        typeof rawState.disabled === 'string'
          ? evaluateLegacyBooleanExpression(unwrapLegacyExpression(rawState.disabled), context)
          : !!evaluateLegacyExpression(rawState.disabled, context);
    }
    if ('value' in rawState) {
      state.value = evaluateLegacyObjectExpressions(rawState.value, context);
      state.hasValue = true;
    }
    if ('componentProps' in rawState) {
      state.componentProps = {
        ...(state.componentProps || {}),
        ...(evaluateLegacyObjectExpressions(rawState.componentProps, context) as Record<string, any>),
      };
    }
    if ('dataSource' in rawState) {
      state.dataSource = evaluateLegacyObjectExpressions(rawState.dataSource, context);
    }
  }

  if (rawSchema?.description !== undefined) {
    state.description = evaluateLegacyExpression(rawSchema.description, context) as React.ReactNode;
  }
}

function evaluateLegacyReactions(options: {
  context: Record<string, boolean>;
  currentName: string;
  formValues: Record<string, any>;
  schema: Record<string, any>;
  selfValue: unknown;
  t: (key: string) => string;
}): LegacyReactionState {
  const { context, currentName, formValues, schema, selfValue, t } = options;
  const reactions = normalizeLegacyReactions(schema?.['x-reactions']);
  const state: LegacyReactionState = {};

  reactions.forEach((reaction) => {
    if (reaction.target) {
      return;
    }

    const dependencies = (reaction.dependencies || []).filter(
      (name: unknown): name is string => typeof name === 'string',
    );
    const deps = dependencies.map((dependency) => resolveLegacyDependencyValue(dependency, currentName, formValues));
    const reactionContext: LegacyReactionContext = {
      context,
      currentName,
      deps,
      selfValue,
      t,
    };
    const matched =
      reaction.when === undefined ||
      (typeof reaction.when === 'string'
        ? evaluateLegacyBooleanExpression(unwrapLegacyExpression(reaction.when), reactionContext)
        : !!evaluateLegacyExpression(reaction.when, reactionContext));
    const result = matched ? reaction.fulfill : reaction.otherwise;
    mergeLegacyReactionState(state, result?.state, result?.schema, reactionContext);
  });

  if (currentName === 'autoCreateReverseField' && get(formValues, ['reverseField', 'key'])) {
    state.disabled = true;
    state.value = true;
    state.hasValue = true;
  }

  return state;
}

function evaluateLegacyTargetReactions(options: {
  context: Record<string, boolean>;
  currentName: string;
  formValues: Record<string, any>;
  properties: Array<{ name: string; schema: any }>;
  t: (key: string) => string;
}) {
  const state: LegacyReactionState = {};

  options.properties.forEach(({ name, schema }) => {
    normalizeLegacyReactions(schema?.['x-reactions'])
      .filter((reaction) => reaction.target === options.currentName)
      .forEach((reaction) => {
        const dependencies = (reaction.dependencies || []).filter(
          (dependency: unknown): dependency is string => typeof dependency === 'string',
        );
        const deps = dependencies.map((dependency) =>
          resolveLegacyDependencyValue(dependency, name, options.formValues),
        );
        const reactionContext: LegacyReactionContext = {
          context: options.context,
          currentName: name,
          deps,
          selfValue: get(options.formValues, toNamePath(name)),
          t: options.t,
        };
        const matched =
          reaction.when === undefined ||
          (typeof reaction.when === 'string'
            ? evaluateLegacyBooleanExpression(unwrapLegacyExpression(reaction.when), reactionContext)
            : !!evaluateLegacyExpression(reaction.when, reactionContext));
        const result = matched ? reaction.fulfill : reaction.otherwise;
        mergeLegacyReactionState(state, result?.state, result?.schema, reactionContext);
      });
  });

  return state;
}

function normalizeSchemaEnum(schemaEnum: unknown, t: (key: string) => string) {
  if (!Array.isArray(schemaEnum)) {
    return [];
  }

  return schemaEnum.map((item) => {
    if (typeof item === 'object' && item !== null) {
      const option = item as { label?: React.ReactNode; value?: string | number | boolean };
      return {
        value: option.value,
        label: compileLegacyTemplate(option.label ?? option.value, t),
      };
    }
    return { value: item, label: String(item) };
  });
}

function collectLeafProperties(properties: Record<string, any>, prefix = ''): Array<{ name: string; schema: any }> {
  return Object.entries(properties).flatMap(([key, schema]) => {
    const name = prefix ? `${prefix}.${key}` : key;
    const childProperties = schema?.properties;
    const component = schema?.['x-component'];

    if (childProperties && (!component || layoutComponents.has(component))) {
      return collectLeafProperties(childProperties, prefix);
    }

    return [{ name, schema }];
  });
}

function isRenderableConfigureProperty(name: string, schema: any) {
  if (commonPropertyNames.has(name)) {
    return false;
  }
  if (schema?.['x-hidden'] === true) {
    return false;
  }
  return !!schema?.['x-component'];
}

function applyPropertyDefaults(values: Record<string, any>, properties: Array<{ name: string; schema: any }>) {
  properties.forEach(({ name, schema }) => {
    if (get(values, name) !== undefined) {
      return;
    }
    if (schema?.default === '{{ useNewId("f_") }}') {
      set(values, name, randomId('f_'));
      return;
    }
    if (
      schema?.default !== undefined &&
      (typeof schema.default !== 'string' || !schema.default.trim().startsWith('{{'))
    ) {
      set(values, name, cloneDeep(schema.default));
    }
  });
}

function toInitialValues(interfaceOptions?: Record<string, any>, field?: Record<string, any>) {
  if (field) {
    return cloneDeep(field);
  }
  const values = {
    name: randomId('f_'),
    ...cloneDeep(interfaceOptions?.default || {}),
    interface: interfaceOptions?.name,
  };
  if (values.reverseField) {
    values.reverseField.name = randomId('f_');
  }
  if (values.uiSchema) {
    delete values.uiSchema.title;
  }
  return values;
}

function shouldRegenerateUntouchedFieldName(values: Record<string, any>, defaultTitle: string) {
  const fieldName = values?.name;
  if (!fieldName) {
    return true;
  }
  const title = get(values, 'uiSchema.title');
  return fieldName === title || fieldName === defaultTitle;
}

function OptionsEditor(props: { name: Array<string | number>; disabled?: boolean }) {
  const t = useT();
  const form = Form.useFormInstance();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const cleanupDefaultValue = useCallback(
    (removedValue: unknown) => {
      const currentDefaultValue = form.getFieldValue('defaultValue');
      if (Array.isArray(currentDefaultValue)) {
        form.setFieldValue(
          'defaultValue',
          currentDefaultValue.filter((item) => item !== removedValue),
        );
        return;
      }
      if (currentDefaultValue === removedValue) {
        form.setFieldValue('defaultValue', undefined);
      }
    },
    [form],
  );

  return (
    <Form.List name={props.name}>
      {(fields, { add, move, remove }) => {
        const sortableItems = fields.map((field) => String(field.key));
        const handleDragEnd = (event: DragEndEvent) => {
          const { active, over } = event;
          if (!over || active.id === over.id) {
            return;
          }
          const oldIndex = sortableItems.indexOf(String(active.id));
          const newIndex = sortableItems.indexOf(String(over.id));
          if (oldIndex < 0 || newIndex < 0) {
            return;
          }
          move(oldIndex, newIndex);
        };
        const columns: ColumnsType<(typeof fields)[number]> = [
          {
            key: 'sort',
            width: 48,
            align: 'center',
            render: () => <OptionSortHandle disabled={props.disabled} />,
          },
          {
            title: t('Option value'),
            dataIndex: 'value',
            render: (_, field) => (
              <Form.Item name={[field.name, 'value']} rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                <Input disabled={props.disabled} />
              </Form.Item>
            ),
          },
          {
            title: t('Option label'),
            dataIndex: 'label',
            render: (_, field) => (
              <Form.Item name={[field.name, 'label']} rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                <Input disabled={props.disabled} />
              </Form.Item>
            ),
          },
          {
            title: t('Color'),
            dataIndex: 'color',
            width: 180,
            render: (_, field) => (
              <Form.Item name={[field.name, 'color']} style={{ marginBottom: 0 }}>
                <Select allowClear disabled={props.disabled} options={optionColorOptions} />
              </Form.Item>
            ),
          },
          {
            key: 'actions',
            width: 56,
            align: 'center',
            render: (_, field) => (
              <Button
                aria-label={t('Delete')}
                icon={<DeleteOutlined />}
                disabled={props.disabled}
                type="text"
                onClick={() => {
                  cleanupDefaultValue(form.getFieldValue([...props.name, field.name, 'value']));
                  remove(field.name);
                }}
              />
            ),
          },
        ];

        return (
          <div style={{ border: '1px solid var(--ant-color-border)', borderRadius: 6, overflow: 'hidden' }}>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={sortableItems} strategy={verticalListSortingStrategy}>
                <Table
                  columns={columns}
                  dataSource={fields}
                  pagination={false}
                  rowKey={(field) => String(field.key)}
                  size="small"
                  locale={{ emptyText: t('No data') }}
                  components={{
                    body: {
                      row: SortableOptionRow,
                    },
                  }}
                />
              </SortableContext>
            </DndContext>
            <Button
              block
              icon={<PlusOutlined />}
              disabled={props.disabled}
              type="dashed"
              size="small"
              style={{
                borderBlockEnd: 0,
                borderInline: 0,
                borderRadius: 0,
                height: 36,
                marginTop: -1,
              }}
              onClick={() => add({ value: randomId(), label: '' })}
            >
              {t('Add option')}
            </Button>
          </div>
        );
      }}
    </Form.List>
  );
}

function toDayjsValue(value: unknown, options?: { timeOnly?: boolean }) {
  if (!value) {
    return null;
  }
  const normalizedValue = options?.timeOnly && typeof value === 'string' ? `2000-01-01 ${value}` : value;
  const nextValue = dayjs(normalizedValue as string);
  return nextValue.isValid() ? nextValue : null;
}

function DefaultValueControl(props: {
  component?: string;
  componentProps: Record<string, any>;
  disabled?: boolean;
  options: Array<{ label: React.ReactNode; value: string | number | boolean }>;
  value?: any;
  onChange?: (value: any) => void;
}) {
  const { component, componentProps, disabled, onChange, options, value } = props;

  if (component === 'Checkbox') {
    return <Checkbox checked={!!value} disabled={disabled} onChange={(event) => onChange?.(event.target.checked)} />;
  }

  if (component === 'Checkbox.Group') {
    return (
      <Checkbox.Group
        disabled={disabled}
        options={options}
        value={Array.isArray(value) ? value : []}
        onChange={(nextValue) => onChange?.(nextValue)}
      />
    );
  }

  if (component === 'Radio.Group') {
    return (
      <Radio.Group
        disabled={disabled}
        options={options}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
      />
    );
  }

  if (component === 'Select') {
    const { mode } = componentProps;
    return (
      <Select
        allowClear
        disabled={disabled}
        mode={mode}
        options={options}
        value={value}
        onChange={(nextValue) => onChange?.(nextValue)}
      />
    );
  }

  if (component === 'InputNumber' || component === 'Percent' || component === 'UnixTimestamp') {
    const { style, ...inputNumberProps } = componentProps;
    return (
      <InputNumber
        style={{ width: '100%', ...style }}
        disabled={disabled}
        value={value}
        onChange={(nextValue) => onChange?.(nextValue)}
        {...inputNumberProps}
      />
    );
  }

  if (component === 'DatePicker') {
    const {
      dateFormat,
      dateOnly,
      format,
      gmt,
      picker = 'date',
      showTime,
      timeFormat = 'HH:mm:ss',
      utc,
      ...datePickerProps
    } = componentProps;
    const resolvedDateFormat = format || dateFormat || getPickerFormat(picker);
    const resolvedFormat = showTime ? `${resolvedDateFormat} ${timeFormat}` : resolvedDateFormat;

    return (
      <DatePicker
        style={{ width: '100%' }}
        disabled={disabled}
        picker={picker}
        showTime={dateOnly ? false : showTime}
        format={resolvedFormat}
        value={toDayjsValue(value)}
        onChange={(_, dateString) => onChange?.(dateString || null)}
        {...datePickerProps}
      />
    );
  }

  if (component === 'TimePicker') {
    const { format = 'HH:mm:ss', ...timePickerProps } = componentProps;
    return (
      <TimePicker
        style={{ width: '100%' }}
        disabled={disabled}
        format={format}
        value={toDayjsValue(value, { timeOnly: true })}
        onChange={(_, dateString) => onChange?.(dateString || null)}
        {...timePickerProps}
      />
    );
  }

  if (component === 'ColorPicker') {
    return <ColorPicker disabled={disabled} value={value} onChange={(_, hex) => onChange?.(hex)} />;
  }

  if (['Input.TextArea', 'Markdown', 'RichText', 'Input.JSON'].includes(component || '')) {
    return (
      <Input.TextArea
        autoSize={{ minRows: 4, maxRows: 8 }}
        disabled={disabled}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
      />
    );
  }

  return <Input disabled={disabled} value={value} onChange={(event) => onChange?.(event.target.value)} />;
}

function NativeFieldValidation(props: {
  value?: {
    type?: string;
    rules?: Array<{ key: string; name: string; args?: Record<string, any>; paramsType?: string }>;
  };
  onChange?: (value?: {
    type?: string;
    rules?: Array<{ key: string; name: string; args?: Record<string, any>; paramsType?: string }>;
  }) => void;
  type?: string;
  availableValidationOptions?: string[];
  excludeValidationOptions?: string[];
}) {
  const t = useT();
  const { availableValidationOptions, excludeValidationOptions, onChange, type, value } = props;
  const rules = useMemo(() => value?.rules || [], [value?.rules]);
  const validationType = value?.type || type || 'string';
  const validationOptions = useMemo(() => {
    const allOptions = [...(fieldValidationOptions[validationType] || [])];
    const filteredOptions = excludeValidationOptions?.length
      ? allOptions.filter((option) => !excludeValidationOptions.includes(option.key))
      : allOptions;
    if (availableValidationOptions?.filter((name) => name !== REQUIRED_RULE_KEY).length) {
      const intersections = availableValidationOptions
        .map((name) => filteredOptions.find((option) => option.key === name))
        .filter(Boolean);
      return intersections.length ? intersections : filteredOptions;
    }
    return filteredOptions;
  }, [availableValidationOptions, excludeValidationOptions, validationType]);
  const usedOptions = new Set(rules.map((rule) => rule.name));
  const menuItems = validationOptions
    .filter((option) => !usedOptions.has(option.key))
    .map((option) => ({
      key: option.key,
      label: t(option.label),
    }));
  const getRuleOption = useCallback(
    (ruleName: string) => validationOptions.find((option) => option.key === ruleName),
    [validationOptions],
  );
  const updateRule = useCallback(
    (ruleKey: string, updater: (rule: (typeof rules)[number]) => (typeof rules)[number]) => {
      onChange?.({
        type: validationType,
        rules: rules.map((rule) => (rule.key === ruleKey ? updater(rule) : rule)),
      });
    },
    [onChange, rules, validationType],
  );
  const menu = useMemo<MenuProps>(
    () => ({
      items: menuItems,
      onClick({ key }) {
        const option = getRuleOption(String(key));
        const args = (option?.params || []).reduce((memo: Record<string, any>, param: Record<string, any>) => {
          if (param.defaultValue !== undefined) {
            memo[param.key] = param.defaultValue;
          }
          return memo;
        }, {});
        onChange?.({
          type: validationType,
          rules: [...rules, { key: randomId('r_'), name: String(key), args, paramsType: option?.paramsType }],
        });
      },
    }),
    [getRuleOption, menuItems, onChange, rules, validationType],
  );

  const handleRemove = useCallback(
    (key: string) => {
      const nextRules = rules.filter((rule) => rule.key !== key);
      onChange?.({
        type: validationType,
        rules: nextRules,
      });
    },
    [onChange, rules, validationType],
  );
  const renderParamControl = useCallback(
    (rule: (typeof rules)[number], param: Record<string, any>) => {
      const currentValue = rule.args?.[param.key] ?? param.defaultValue;
      const handleChange = (nextValue: any) => {
        updateRule(rule.key, (currentRule) => ({
          ...currentRule,
          args: {
            ...(currentRule.args || {}),
            [param.key]: nextValue,
          },
        }));
      };

      if (param.componentType === 'checkbox') {
        return <Checkbox checked={!!currentValue} onChange={(event) => handleChange(event.target.checked)} />;
      }

      if (param.componentType === 'radio') {
        return (
          <Radio.Group
            value={currentValue}
            options={(param.options || []).map((option) => ({ label: t(option.label), value: option.value }))}
            onChange={(event) => handleChange(event.target.value)}
          />
        );
      }

      if (param.componentType === 'singleSelect' || param.componentType === 'multipleSelect') {
        return (
          <Select
            allowClear
            mode={param.componentType === 'multipleSelect' ? 'multiple' : undefined}
            value={currentValue}
            options={(param.options || []).map((option) => ({ label: t(option.label), value: option.value }))}
            onChange={handleChange}
          />
        );
      }

      if (param.componentType === 'inputNumber') {
        return <InputNumber style={{ width: '100%' }} value={currentValue} onChange={handleChange} />;
      }

      if (param.componentType === 'datePicker') {
        return (
          <DatePicker
            style={{ width: '100%' }}
            value={currentValue ? dayjs(currentValue) : null}
            onChange={(date) => handleChange(date?.toISOString())}
          />
        );
      }

      return <Input value={currentValue} onChange={(event) => handleChange(event.target.value)} />;
    },
    [t, updateRule],
  );

  return (
    <div>
      <Space direction="vertical" style={{ width: '100%', marginBottom: rules.length ? 12 : 0 }} size={0}>
        {rules.map((rule) => {
          const option = getRuleOption(rule.name);
          return (
            <div
              key={rule.key}
              style={{
                border: '1px solid var(--ant-color-border)',
                borderRadius: 6,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  alignItems: 'center',
                  display: 'flex',
                  justifyContent: 'space-between',
                  minHeight: 40,
                  padding: '8px 12px',
                }}
              >
                <Space>
                  <DownOutlined />
                  <span>{t(option?.label || rule.name)}</span>
                </Space>
                <Button
                  aria-label={t('Delete')}
                  icon={<DeleteOutlined />}
                  size="small"
                  type="text"
                  onClick={() => handleRemove(rule.key)}
                />
              </div>
              {option?.hasValue && option.params?.length ? (
                <div
                  style={{
                    background: 'var(--ant-color-fill-tertiary)',
                    borderTop: '1px solid var(--ant-color-border)',
                    padding: 12,
                  }}
                >
                  {option.params.map((param) => (
                    <Form.Item
                      key={param.key}
                      label={t(param.label)}
                      required={!!param.required}
                      style={{ marginBottom: 0 }}
                    >
                      {renderParamControl(rule, param)}
                    </Form.Item>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </Space>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Dropdown menu={menu} placement="bottomLeft" disabled={!menuItems.length}>
          <Button size="small" type="dashed" icon={<PlusOutlined />}>
            {t('Add rule')} <DownOutlined />
          </Button>
        </Dropdown>
        <span>
          <span style={{ color: 'var(--ant-color-text-secondary)' }}>{t('References')}: </span>
          <a href="https://joi.dev/api/" target="_blank" rel="noreferrer">
            {t('Joi API')}
          </a>
        </span>
      </div>
    </div>
  );
}

function FieldInterfaceSummary(props: { label: React.ReactNode }) {
  const t = useT();

  return (
    <div
      style={{
        marginBottom: 24,
        padding: '16px 16px',
        background: 'var(--ant-color-fill-quaternary)',
      }}
    >
      <Space>
        <span>{t('Field interface')}:</span>
        <Tag style={{ marginInlineEnd: 0 }}>{props.label}</Tag>
      </Space>
    </div>
  );
}

function getCollectionTemplate(collection: Record<string, any>) {
  return collection?.template || collection?.options?.template;
}

function getCollectionOptions(collections: Array<Record<string, any>>, t: (key: string) => string) {
  return collections.map((item) => ({
    value: item.name,
    label: compileLegacyTemplate(item.title || item.name, t),
  }));
}

function getFileCollectionOptions(collections: Array<Record<string, any>>, t: (key: string) => string) {
  return getCollectionOptions(
    collections.filter((item) => item.name && getCollectionTemplate(item) === 'file'),
    t,
  );
}

function FieldConfigurePropertyItem(props: {
  name: string;
  schema: any;
  components?: Record<string, React.ComponentType<any>>;
  context: Record<string, boolean>;
  collection: Record<string, any>;
  collections: Array<Record<string, any>>;
  configureProperties: Array<{ name: string; schema: any }>;
  fieldInterface: Record<string, any>;
  form: ReturnType<typeof Form.useForm>[0];
}) {
  const t = useT();
  const { collection, collections, components, configureProperties, context, form, name, schema } = props;
  const namePath = toNamePath(name);
  const component = schema?.['x-component'];
  const CustomComponent = component ? components?.[component] : undefined;
  const targetCollectionName = Form.useWatch('target', form);
  const autoCreateReverseField = Form.useWatch('autoCreateReverseField', form);
  const inputable = Form.useWatch('inputable', form);
  const dataType = Form.useWatch('dataType', form);
  const showTime = Form.useWatch(['uiSchema', 'x-component-props', 'showTime'], form);
  const uiSchemaEnum = Form.useWatch(['uiSchema', 'enum'], form);
  const formValues = Form.useWatch([], form) || form.getFieldsValue(true);
  const selfValue = get(formValues, namePath);
  const reactionDependencies = useMemo(() => getLegacyReactionDependencies(schema), [schema]);
  const reactionDependencyValues = useMemo(
    () =>
      reactionDependencies.map((dependency) =>
        resolveLegacyDependencyValue(dependency, name, formValues as Record<string, any>),
      ),
    [formValues, name, reactionDependencies],
  );
  const reactionDependencySignature = useMemo(
    () => JSON.stringify(reactionDependencyValues),
    [reactionDependencyValues],
  );
  const lastReactionDependencySignatureRef = useRef<string>();
  const dynamicContext = useMemo(
    () => ({
      ...context,
      inputable: !!inputable,
      showReverseFieldConfig: !!autoCreateReverseField || !!form.getFieldValue(['reverseField', 'key']),
    }),
    [autoCreateReverseField, context, form, inputable],
  );
  const reactionState = useMemo(() => {
    const selfState = evaluateLegacyReactions({
      context: dynamicContext,
      currentName: name,
      formValues: formValues as Record<string, any>,
      schema,
      selfValue,
      t,
    });
    const targetState = evaluateLegacyTargetReactions({
      context: dynamicContext,
      currentName: name,
      formValues: formValues as Record<string, any>,
      properties: configureProperties,
      t,
    });
    return {
      ...targetState,
      ...selfState,
      componentProps: {
        ...(targetState.componentProps || {}),
        ...(selfState.componentProps || {}),
      },
    };
  }, [configureProperties, dynamicContext, formValues, name, schema, selfValue, t]);
  const disabled = reactionState.disabled ?? isTruthyExpression(schema?.['x-disabled'], dynamicContext);
  const hidden =
    !!reactionState.hidden ||
    isTruthyExpression(schema?.['x-hidden'], dynamicContext) ||
    (name === 'uiSchema.x-component-props.step' && !['double', 'decimal'].includes(dataType)) ||
    (['uiSchema.x-component-props.dateFormat', 'uiSchema.x-component-props.showTime'].includes(name) &&
      dataType !== 'date') ||
    (name === 'uiSchema.x-component-props.timeFormat' && (dataType !== 'date' || showTime === false)) ||
    (name.startsWith('reverseField.') && !dynamicContext.showReverseFieldConfig);
  const title = compileLegacyTemplate(schema?.title || schema?.['x-content'] || name, t);
  const tooltip = compileLegacyTemplate(reactionState.description ?? schema?.description, t);
  const componentProps = {
    ...(schema?.['x-component-props'] || {}),
    ...(reactionState.componentProps || {}),
  };
  const currentCollectionFields = collection.fields || [];
  const targetCollection = collections.find((item) => item.name === targetCollectionName);
  const targetCollectionFields = targetCollection?.fields || [];

  useEffect(() => {
    if (!reactionState.hasValue) {
      lastReactionDependencySignatureRef.current = undefined;
      return;
    }
    if (lastReactionDependencySignatureRef.current === reactionDependencySignature) {
      return;
    }
    lastReactionDependencySignatureRef.current = reactionDependencySignature;
    if (get(form.getFieldsValue(true), namePath) === reactionState.value) {
      return;
    }
    form.setFieldValue(namePath, reactionState.value);
  }, [form, namePath, reactionDependencySignature, reactionState.hasValue, reactionState.value]);

  if (hidden) {
    return null;
  }

  if (name === 'defaultValue') {
    const optionsSource =
      reactionState.dataSource ||
      (Array.isArray(uiSchemaEnum) ? uiSchemaEnum : undefined) ||
      schema?.enum ||
      componentProps.options;
    const options = normalizeSchemaEnum(optionsSource, t);

    return (
      <Form.Item
        name={namePath}
        label={title}
        tooltip={tooltip}
        rules={schema?.required ? [{ required: true }] : undefined}
      >
        <DefaultValueControl
          component={component}
          componentProps={componentProps}
          disabled={disabled}
          options={options}
        />
      </Form.Item>
    );
  }

  if (CustomComponent) {
    return (
      <CustomComponent
        name={name}
        namePath={namePath}
        schema={schema}
        form={form}
        disabled={disabled}
        collection={collection}
        collections={collections}
        context={dynamicContext}
        title={title}
        tooltip={tooltip}
        componentProps={componentProps}
        mode={context.createOnly ? 'create' : 'edit'}
        fieldInterface={props.fieldInterface}
      />
    );
  }

  if (component === 'Checkbox') {
    return (
      <Form.Item name={namePath} valuePropName="checked" tooltip={tooltip}>
        <Checkbox disabled={disabled}>{title}</Checkbox>
      </Form.Item>
    );
  }

  if (component === 'Space' && schema?.properties) {
    return (
      <Form.Item label={title} tooltip={tooltip}>
        <Space wrap>
          {Object.entries(schema.properties)
            .filter(([, childSchema]) => (childSchema as Record<string, any>)?.['x-component'] === 'Checkbox')
            .map(([childName, childSchema]) => {
              const typedSchema = childSchema as Record<string, any>;
              const childDisabled = isTruthyExpression(typedSchema?.['x-disabled'], dynamicContext);
              const childTitle = compileLegacyTemplate(
                typedSchema?.title || typedSchema?.['x-content'] || childName,
                t,
              );
              return (
                <Form.Item key={childName} name={toNamePath(childName)} valuePropName="checked" noStyle>
                  <Checkbox disabled={childDisabled}>{childTitle}</Checkbox>
                </Form.Item>
              );
            })}
        </Space>
      </Form.Item>
    );
  }

  if (component === 'InputNumber') {
    return (
      <Form.Item
        name={namePath}
        label={title}
        tooltip={tooltip}
        rules={schema?.required ? [{ required: true }] : undefined}
      >
        <InputNumber style={{ width: '100%' }} disabled={disabled} {...componentProps} />
      </Form.Item>
    );
  }

  if (
    component === 'Select' ||
    component === 'CollectionSelect' ||
    component === 'RemoteSelect' ||
    component === 'TargetKey' ||
    component === 'SourceKey' ||
    component === 'ExpiresRadio'
  ) {
    const fieldOptions = targetKeyPropertyNames.has(name)
      ? targetCollectionFields
          .filter((field) => field.primaryKey || field.unique)
          .map((field) => ({
            value: field.name,
            label: compileLegacyTemplate(field.uiSchema?.title || field.name, t),
          }))
      : sourceKeyPropertyNames.has(name)
        ? currentCollectionFields
            .filter((field) => field.primaryKey || field.unique)
            .map((field) => ({
              value: field.name,
              label: compileLegacyTemplate(field.uiSchema?.title || field.name, t),
            }))
        : relationCollectionPropertyNames.has(name) &&
            collectionOptionComponents.has(component) &&
            !Array.isArray(schema?.enum)
          ? getCollectionOptions(
              collections.filter((item) => item.name && item.name !== collection.name),
              t,
            )
          : schema?.enum === fileCollectionEnum
            ? getFileCollectionOptions(collections, t)
            : component === 'CollectionSelect' || component === 'RemoteSelect'
              ? getCollectionOptions(collections, t)
              : normalizeSchemaEnum(schema?.enum, t);

    const { filter, ...selectProps } = componentProps;
    const filteredOptions =
      typeof filter === 'function'
        ? fieldOptions.filter((option) => {
            const currentCollection = collections.find((item) => item.name === option.value);
            return filter(currentCollection);
          })
        : fieldOptions;

    return (
      <Form.Item
        name={namePath}
        label={title}
        tooltip={tooltip}
        rules={schema?.required ? [{ required: true }] : undefined}
      >
        <Select
          allowClear={selectProps.allowClear ?? true}
          disabled={disabled}
          options={filteredOptions}
          {...selectProps}
        />
      </Form.Item>
    );
  }

  if (component === 'Radio.Group') {
    return (
      <Form.Item
        name={namePath}
        label={title}
        tooltip={tooltip}
        rules={schema?.required ? [{ required: true }] : undefined}
      >
        <Radio.Group disabled={disabled} options={normalizeSchemaEnum(schema?.enum, t)} />
      </Form.Item>
    );
  }

  if (component === 'ArrayTable' && name === 'uiSchema.enum') {
    return (
      <Form.Item label={title} tooltip={tooltip}>
        <OptionsEditor name={namePath} disabled={disabled} />
      </Form.Item>
    );
  }

  if (component === 'FieldValidation') {
    return (
      <Form.Item name={namePath} label={title} tooltip={tooltip}>
        <NativeFieldValidation {...(schema?.['x-component-props'] || {})} />
      </Form.Item>
    );
  }

  if (component === 'Input.TextArea') {
    return (
      <Form.Item
        name={namePath}
        label={title}
        tooltip={tooltip}
        rules={schema?.required ? [{ required: true }] : undefined}
      >
        <Input.TextArea disabled={disabled} />
      </Form.Item>
    );
  }

  if (component === 'SourceCollection') {
    return (
      <Form.Item label={title} tooltip={tooltip}>
        <Input disabled value={compileLegacyTemplateText(collection.title || collection.name, t)} />
      </Form.Item>
    );
  }

  if (component === 'ForeignKey' || component === 'ThroughCollection') {
    return (
      <Form.Item
        name={namePath}
        label={title}
        tooltip={tooltip}
        rules={schema?.required ? [{ required: true }] : undefined}
      >
        <Input disabled={disabled} />
      </Form.Item>
    );
  }

  return (
    <Form.Item
      name={namePath}
      label={title}
      tooltip={tooltip}
      rules={schema?.required ? [{ required: true }] : undefined}
    >
      <Input disabled={disabled} />
    </Form.Item>
  );
}

export function FieldForm(props: FieldFormProps) {
  const t = useT();
  const ctx = useFlowContext();
  const appInfo = useCurrentAppInfo<{ database?: { dialect?: string } }>();
  const fieldInterfaceManager = getFieldInterfaceManager(ctx);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const dataSource = ctx.dataSourceManager.getDataSource(props.dataSourceKey);
  const fieldInterfaces = useMemo(
    () =>
      filterFieldInterfacesByTemplate(
        getFieldInterfaces(ctx, dataSource?.options?.type),
        props.collection,
        ctx,
        props.mode,
        appInfo?.database?.dialect,
      ),
    [appInfo?.database?.dialect, ctx, dataSource?.options?.type, props.collection, props.mode],
  );
  const [interfaceName, setInterfaceName] = useState(
    props.field?.interface || props.interfaceName || fieldInterfaces[0]?.name,
  );
  const fieldInterface = useMemo(
    () => fieldInterfaces.find((item) => item.name === interfaceName),
    [fieldInterfaces, interfaceName],
  );
  const configure = interfaceName
    ? fieldInterfaceManager?.getFieldInterfaceConfigure?.(interfaceName, props.collection)
    : undefined;
  const fieldInterfaceOptions = useMemo<Record<string, any> | undefined>(
    () =>
      fieldInterface || configure
        ? {
            ...fieldInterface,
            ...configure,
            default: configure?.default || fieldInterface?.default,
            name: configure?.name || fieldInterface?.name,
          }
        : undefined,
    [configure, fieldInterface],
  );
  const fieldInterfaceTitle = compileLegacyTemplate(fieldInterfaceOptions?.title || interfaceName || '-', t);
  const fieldInterfaceTitleText = compileLegacyTemplateText(fieldInterfaceOptions?.title || interfaceName || '-', t);
  const ConfigureForm = configure?.ConfigureForm || configure?.Component;
  const fieldConfigureProperties = useMemo(() => {
    if (!interfaceName || ConfigureForm) {
      return [];
    }
    const properties = configure?.properties || fieldInterface?.getConfigureFormProperties?.(props.collection) || {};

    return collectLeafProperties(properties).filter(({ name, schema }) => isRenderableConfigureProperty(name, schema));
  }, [ConfigureForm, configure, fieldInterface, interfaceName, props.collection]);
  const [collections, setCollections] = useState<Array<Record<string, any>>>([]);
  const needsCollectionOptions = useMemo(
    () =>
      fieldConfigureProperties.some(
        ({ name, schema }) =>
          relationCollectionPropertyNames.has(name) ||
          schema?.enum === '{{collections}}' ||
          schema?.enum === fileCollectionEnum ||
          schema?.['x-component'] === 'CollectionSelect' ||
          schema?.['x-component'] === 'RemoteSelect',
      ),
    [fieldConfigureProperties],
  );
  const rendersStorageType = useMemo(
    () => fieldConfigureProperties.some((property) => property.name === 'type'),
    [fieldConfigureProperties],
  );
  const initialValues = useMemo(() => {
    const values = toInitialValues(fieldInterfaceOptions, props.field);
    if (!props.field) {
      applyPropertyDefaults(values, fieldConfigureProperties);
      if ((fieldInterface?.isAssociation || configure?.isAssociation) && !get(values, 'source')) {
        set(values, 'source', props.collection.name);
      }
    }
    return values;
  }, [
    configure?.isAssociation,
    fieldConfigureProperties,
    fieldInterface?.isAssociation,
    fieldInterfaceOptions,
    props.collection.name,
    props.field,
  ]);

  useEffect(() => {
    form.setFieldsValue(initialValues);
  }, [form, initialValues]);

  useEffect(() => {
    if (!needsCollectionOptions) {
      return undefined;
    }

    let ignore = false;
    const loadCollections = async () => {
      const response = await ctx.api.request({
        url: `dataSources/${props.dataSourceKey}/collections:list`,
        params: {
          paginate: false,
          sort: ['sort'],
          filter: {
            'hidden.$isFalsy': true,
          },
          appends: ['fields'],
        },
      });
      if (!ignore) {
        setCollections(normalizeListResponse(response));
      }
    };

    loadCollections();

    return () => {
      ignore = true;
    };
  }, [ctx.api, needsCollectionOptions, props.dataSourceKey]);

  useEffect(() => {
    if (!interfaceName && props.interfaceName) {
      setInterfaceName(props.interfaceName);
      return;
    }
    if (!interfaceName && fieldInterfaces[0]?.name) {
      setInterfaceName(fieldInterfaces[0].name);
    }
  }, [fieldInterfaces, interfaceName, props.interfaceName]);

  const handleInterfaceChange = useCallback(
    (nextInterface: string) => {
      const nextFieldInterface = fieldInterfaces.find((item) => item.name === nextInterface);
      const nextConfigure = fieldInterfaceManager?.getFieldInterfaceConfigure?.(nextInterface, props.collection);
      const currentTitle = form.getFieldValue(['uiSchema', 'title']);
      const nextOptions = {
        ...nextFieldInterface,
        ...nextConfigure,
        default: nextConfigure?.default || nextFieldInterface?.default,
        name: nextConfigure?.name || nextFieldInterface?.name,
      };
      const nextValues = toInitialValues(nextOptions);
      const nextProperties =
        nextConfigure?.ConfigureForm || nextConfigure?.Component || !nextInterface
          ? []
          : collectLeafProperties(nextConfigure?.properties || nextFieldInterface?.properties || {}).filter(
              ({ name, schema }) => isRenderableConfigureProperty(name, schema),
            );
      applyPropertyDefaults(nextValues, nextProperties);
      if ((nextFieldInterface?.isAssociation || nextConfigure?.isAssociation) && !get(nextValues, 'source')) {
        set(nextValues, 'source', props.collection.name);
      }
      if (currentTitle) {
        set(nextValues, 'uiSchema.title', currentTitle);
      }
      setInterfaceName(nextInterface);
      form.resetFields();
      form.setFieldsValue(nextValues);
    },
    [fieldInterfaceManager, fieldInterfaces, form, props.collection],
  );

  const normalizeValues = useCallback(
    (values: Record<string, any>) => {
      const context = {
        mode: props.mode,
        fieldInterface: fieldInterfaceOptions,
        collection: props.collection,
        field: props.field,
        createOnly: props.mode === 'create',
        editMainOnly: props.mode === 'edit',
        disabledJSONB: props.mode === 'edit',
      };
      const normalized = configure?.normalizeValues
        ? configure.normalizeValues(values, context as any)
        : configure?.normalize
          ? configure.normalize(values, context as any)
          : values;
      const cloned = cloneDeep(normalized);
      if (!cloned.autoCreateReverseField) {
        delete cloned.reverseField;
      } else if (!get(cloned, 'reverseField.uiSchema.title')) {
        set(cloned, 'reverseField.uiSchema.title', get(cloned, 'uiSchema.title'));
      }
      delete cloned.autoCreateReverseField;
      fieldInterface?.initialize?.(cloned);
      configure?.initialize?.(cloned, context as any);
      return cloned;
    },
    [configure, fieldInterface, fieldInterfaceOptions, props.collection, props.field, props.mode],
  );

  const handleSubmit = useCallback(async () => {
    const currentValues = form.getFieldsValue(true);
    if (
      props.mode === 'create' &&
      !form.isFieldTouched('name') &&
      shouldRegenerateUntouchedFieldName(currentValues, fieldInterfaceTitleText)
    ) {
      form.setFieldValue('name', randomId('f_'));
    }
    const formValues = await form.validateFields();
    await configure?.validate?.(formValues, {
      mode: props.mode,
      fieldInterface: fieldInterfaceOptions,
      collection: props.collection,
      field: props.field,
      createOnly: props.mode === 'create',
      editMainOnly: props.mode === 'edit',
      disabledJSONB: props.mode === 'edit',
    } as any);
    const values = normalizeValues(formValues);
    setSubmitting(true);
    try {
      if (props.mode === 'create') {
        await ctx.api.request({
          url: getCollectionFieldActionUrl(props.dataSourceKey, props.collection.name, 'create'),
          method: 'post',
          data: values,
        });
      } else {
        await ctx.api.request({
          url: getCollectionFieldActionUrl(props.dataSourceKey, props.collection.name, 'update', props.field?.name),
          method: 'post',
          data: values,
        });
      }
      await ctx.dataSourceManager.getDataSource(props.dataSourceKey)?.reload();
      props.onSubmitted();
    } finally {
      setSubmitting(false);
    }
  }, [
    configure,
    ctx.api,
    ctx.dataSourceManager,
    fieldInterfaceOptions,
    fieldInterfaceTitleText,
    form,
    normalizeValues,
    props,
  ]);

  const collectionTitle = compileLegacyTemplateText(get(props.collection, 'title') || props.collection.name, t);
  const title = `${collectionTitle} - ${props.mode === 'create' ? t('Add field') : t('Edit field')}`;
  const existingFieldNames = new Set((props.collection.fields || []).map((field: Record<string, any>) => field.name));

  return (
    <DrawerFormLayout
      title={title}
      onSubmit={handleSubmit}
      submitting={submitting}
      submitText={t('Submit')}
      cancelText={t('Cancel')}
    >
      <Form form={form} layout="vertical" initialValues={initialValues}>
        <FieldInterfaceSummary label={fieldInterfaceTitle} />
        {!props.interfaceName && props.mode === 'create' ? (
          <Form.Item name="interface" label={t('Field interface')} rules={[{ required: true }]}>
            <Select
              options={fieldInterfaces.map((item) => ({
                value: item.name,
                label: compileLegacyTemplate(item.title || item.name, t),
              }))}
              onChange={handleInterfaceChange}
            />
          </Form.Item>
        ) : (
          <Form.Item name="interface" hidden rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        )}
        <Form.Item name={['uiSchema', 'title']} label={t('Field display name')} rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item
          name="name"
          label={t('Field name')}
          rules={[
            { required: true },
            { pattern: fieldNamePattern, message: t(fieldNameDescription) },
            {
              validator: (_, value) => {
                if (props.mode === 'edit' || !value || !existingFieldNames.has(value)) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error(t('Field name already exists')));
              },
            },
          ]}
          extra={t(fieldNameDescription)}
        >
          <Input disabled={props.mode === 'edit'} />
        </Form.Item>
        {fieldConfigureProperties.map(({ name, schema }) => (
          <FieldConfigurePropertyItem
            key={name}
            name={name}
            schema={schema}
            components={configure?.components}
            collection={props.collection}
            collections={collections}
            configureProperties={fieldConfigureProperties}
            fieldInterface={fieldInterfaceOptions}
            form={form}
            context={{
              createOnly: props.mode === 'create',
              editMainOnly: props.mode === 'edit',
              createMainOnly: props.mode === 'create' && props.dataSourceKey === 'main',
              disabledJSONB: props.mode === 'edit',
              primaryKeyOnly: false,
            }}
          />
        ))}
        {rendersStorageType ? null : (
          <Form.Item name="type" hidden rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        )}
        {ConfigureForm && configure ? (
          <ConfigureForm
            mode={props.mode}
            fieldInterface={configure}
            collection={props.collection}
            field={props.field}
            createOnly={props.mode === 'create'}
            editMainOnly={props.mode === 'edit'}
            disabledJSONB={props.mode === 'edit'}
          />
        ) : null}
        <Form.Item name="description" label={t('Description')}>
          <Input.TextArea autoSize={{ minRows: 4, maxRows: 8 }} />
        </Form.Item>
      </Form>
    </DrawerFormLayout>
  );
}
