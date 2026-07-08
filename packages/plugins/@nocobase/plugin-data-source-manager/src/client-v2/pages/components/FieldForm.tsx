/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  DrawerFormLayout,
  evaluateFieldConfigureExpression,
  fieldValidationConfigureRegistry,
  getCoreFieldConfigureState,
  runCoreFieldConfigureEffects,
  type FieldConfigureItem,
  type FieldConfigureRuntimeContext,
  type FieldValidationConfigureItem,
  useCurrentAppInfo,
} from '@nocobase/client-v2';
import { randomId, useFlowContext } from '@nocobase/flow-engine';
import { getPickerFormat } from '@nocobase/utils/client';
import { DeleteOutlined, DownOutlined, MenuOutlined, PlusOutlined, RightOutlined } from '@ant-design/icons';
import { closestCenter, DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent, DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Button,
  Checkbox,
  Col,
  ColorPicker,
  DatePicker,
  Dropdown,
  Form,
  Input,
  InputNumber,
  Radio,
  Row,
  Select,
  Space,
  Table,
  Tag,
  theme,
  TimePicker,
  App,
} from 'antd';
import type { MenuProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { cloneDeep, get, set } from 'lodash';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useT } from '../../locale';
import { PluginDataSourceManagerClientV2 } from '../../plugin';
import { compileLegacyTemplate, compileLegacyTemplateText } from '../../utils/compileLegacyTemplate';
import { getErrorMessage, isFormValidationError } from '../../utils/error';
import { getCollectionFieldActionUrl } from './collectionFieldApi';
import {
  filterCreateFieldInterfacesByCollectionTemplate,
  filterFieldInterfacesByCollectionTemplate,
} from './collectionTemplateFieldInterfaces';

interface FieldFormProps {
  mode: 'create' | 'edit';
  dataSourceKey: string;
  collection: Record<string, any>;
  interfaceName?: string;
  field?: Record<string, any>;
  override?: boolean;
  onSubmitted: () => void;
}

interface FieldInterfaceManagerWithConfigure {
  getFieldInterfaceConfigure?: (name: string, collectionInfo?: Record<string, any>) => Record<string, any> | undefined;
}

type ConfigureProperty = { name: string; schema: any };
type FieldInterfaceOption = Record<string, any> & { name: string };

function formatFallbackRuleLabel(name: string) {
  if (!name) {
    return name;
  }
  return `${name.slice(0, 1).toUpperCase()}${name.slice(1)}`;
}

function getFieldInterfaces(ctx: any, dataSourceType?: string): FieldInterfaceOption[] {
  return (ctx.dataSourceManager.collectionFieldInterfaceManager?.getFieldInterfaces?.(dataSourceType) ||
    []) as FieldInterfaceOption[];
}

function getAppInfoDatabaseDialect(appInfo?: Record<string, any>) {
  return appInfo?.database?.dialect || appInfo?.data?.database?.dialect;
}

function getFieldInterfaceManager(ctx: any) {
  return ctx.dataSourceManager.collectionFieldInterfaceManager as FieldInterfaceManagerWithConfigure | undefined;
}

function filterFieldInterfacesByTemplate(
  fieldInterfaces: FieldInterfaceOption[],
  collection: Record<string, any>,
  ctx: any,
  databaseDialect?: string,
) {
  const plugin = ctx.app.pm.get(PluginDataSourceManagerClientV2);
  const template = plugin?.getCollectionTemplate?.(collection.template || 'general');
  return filterFieldInterfacesByCollectionTemplate<FieldInterfaceOption>(fieldInterfaces, template, collection, {
    databaseDialect,
  });
}

function filterCreateFieldInterfacesByTemplate(
  fieldInterfaces: FieldInterfaceOption[],
  collection: Record<string, any>,
  ctx: any,
) {
  const plugin = ctx.app.pm.get(PluginDataSourceManagerClientV2);
  const template = plugin?.getCollectionTemplate?.(collection.template || 'general');
  return filterCreateFieldInterfacesByCollectionTemplate(fieldInterfaces, template);
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

const fieldNamePattern = /^[a-zA-Z][a-zA-Z0-9_-]*$/;
const fieldNameDescription =
  'Randomly generated and can be modified. Support letters, numbers and underscores, must start with a letter.';
const collectionOptionComponents = new Set(['Select', 'CollectionSelect', 'RemoteSelect']);
const relationCollectionPropertyNames = new Set(['target']);
const fileCollectionEnum = '{{fileCollections}}';
const sourceKeyPropertyNames = new Set(['sourceKey']);
const targetKeyPropertyNames = new Set(['targetKey']);
const validationConfigureItemName = 'validation';
const optionColorLabels: Record<string, string> = {
  red: 'Red',
  magenta: 'Magenta',
  volcano: 'Volcano',
  orange: 'Orange',
  gold: 'Gold',
  lime: 'Lime',
  green: 'Green',
  cyan: 'Cyan',
  blue: 'Blue',
  geekblue: 'Geek blue',
  purple: 'Purple',
  default: 'Default',
};
const defaultColorPickerPresets = [
  {
    label: 'Recommended',
    colors: [
      '#8BBB11',
      '#52C41A',
      '#13A8A8',
      '#1677FF',
      '#F5222D',
      '#FADB14',
      '#E6F4FF',
      '#fff1f0',
      '#F6FFED',
      '#E6FFFB',
      '#FA8C164D',
      '#FADB144D',
      '#52C41A4D',
      '#1677FF4D',
      '#2F54EB4D',
      '#722ED14D',
    ],
  },
];
const REQUIRED_RULE_KEY = 'required';
type SortableOptionRowProps = React.HTMLAttributes<HTMLTableRowElement> & {
  'data-row-key': string;
};

function splitValidationConfigureItems(
  items: FieldConfigureItem[],
  enabled: boolean,
): { mainConfigureItems: FieldConfigureItem[]; validationConfigureItems: FieldConfigureItem[] } {
  if (!enabled) {
    return {
      mainConfigureItems: items,
      validationConfigureItems: [],
    };
  }
  return {
    mainConfigureItems: items.filter((item) => item.name !== validationConfigureItemName),
    validationConfigureItems: items.filter((item) => item.name === validationConfigureItemName),
  };
}

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

function isTruthyExpression(value: unknown, context: Record<string, unknown>) {
  return evaluateFieldConfigureExpression(value, {
    context,
    values: context,
    getValue: (name) => get(context, name),
    setValue: () => {},
  });
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

function resolveConfigureDefaultValue(value: unknown) {
  if (typeof value !== 'string') {
    return cloneDeep(value);
  }

  const useNewIdExpression = value.match(/^\s*\{\{\s*useNewId\((['"])(.*?)\1\)\s*\}\}\s*$/);
  if (useNewIdExpression) {
    return randomId(useNewIdExpression[2]);
  }

  return value;
}

function applyItemDefaults(values: Record<string, any>, items: FieldConfigureItem[]) {
  items.forEach((item) => {
    if (get(values, item.name) !== undefined || item.defaultValue === undefined) {
      return;
    }
    set(values, item.name, resolveConfigureDefaultValue(item.defaultValue));
  });
}

function buildConfigureItemSchema(item: FieldConfigureItem) {
  const schema: Record<string, any> = {};
  if (item.title !== undefined) {
    schema.title = item.title;
  }
  if (item.description !== undefined) {
    schema.description = item.description;
  }
  if (item.required !== undefined) {
    schema.required = item.required;
  }
  if (item.options !== undefined) {
    schema.enum = item.options;
  }
  if (item.defaultValue !== undefined) {
    schema.default = item.defaultValue;
  }
  if (item.component !== undefined) {
    schema['x-component'] = item.component;
  }
  if (item.componentProps !== undefined) {
    schema['x-component-props'] = item.componentProps;
  }
  return schema;
}

function createConfigureRuntimeContext(
  form: ReturnType<typeof Form.useForm>[0],
  values: Record<string, any>,
  context: FieldConfigureRuntimeContext,
  changedName?: string,
) {
  return {
    changedName,
    context,
    values,
    getValue: (name: string) => get(values, name),
    setValue: (name: string, value: unknown) => {
      if (get(form.getFieldsValue(true), name) !== value) {
        form.setFieldValue(toNamePath(name), value);
      }
    },
  };
}

function toInitialValues(
  interfaceOptions: Record<string, any> | undefined,
  field: Record<string, any> | undefined,
  t: (key: string) => string,
) {
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
  if (values.uiSchema && interfaceOptions?.name !== 'tableoid') {
    delete values.uiSchema.title;
  }
  if (interfaceOptions?.name === 'tableoid') {
    set(values, 'name', '__collection');
    set(values, 'uiSchema.title', compileLegacyTemplateText(get(values, 'uiSchema.title') || '{{t("Table OID")}}', t));
  }
  return values;
}

function normalizeFieldNameComparisonText(value: unknown) {
  return typeof value === 'string' ? value.replace(/[^a-zA-Z0-9_-]/g, '') : '';
}

function shouldRegenerateUntouchedFieldName(values: Record<string, any>, defaultTitle: string) {
  const fieldName = values?.name;
  if (!fieldName) {
    return true;
  }
  const title = get(values, 'uiSchema.title');
  const normalizedFieldName = normalizeFieldNameComparisonText(fieldName);
  return (
    fieldName === title ||
    fieldName === defaultTitle ||
    (!!normalizedFieldName &&
      (normalizedFieldName === normalizeFieldNameComparisonText(title) ||
        normalizedFieldName === normalizeFieldNameComparisonText(defaultTitle)))
  );
}

function buildInitialValuesKey(options: {
  collectionName?: string;
  dataSourceKey: string;
  fieldName?: string;
  interfaceName?: string;
  mode: FieldFormProps['mode'];
}) {
  return [
    options.mode,
    options.dataSourceKey,
    options.collectionName || '',
    options.fieldName || '',
    options.interfaceName || '',
  ].join(':');
}

function OptionsEditor(props: { name: Array<string | number>; disabled?: boolean }) {
  const t = useT();
  const form = Form.useFormInstance();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const colorOptions = useMemo(
    () =>
      Object.keys(optionColorLabels).map((color) => ({
        value: color,
        label: (
          <Tag color={color} style={{ marginInlineEnd: 0 }}>
            {t(optionColorLabels[color] || optionColorLabels.default)}
          </Tag>
        ),
      })),
    [t],
  );
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
                <Select allowClear disabled={props.disabled} options={colorOptions} />
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
    return (
      <ColorPicker
        allowClear
        disabled={disabled}
        value={value}
        trigger="hover"
        destroyTooltipOnHide
        presets={defaultColorPickerPresets}
        onChange={(_, hex) => onChange?.(hex)}
        {...componentProps}
      />
    );
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

function ConfigureSelectControl(props: {
  allowClear?: boolean;
  autoSelectFirstOption?: boolean;
  disabled?: boolean;
  form: ReturnType<typeof Form.useForm>[0];
  namePath: Array<string | number>;
  onChange?: (value: unknown, option: unknown) => void;
  options: Array<{ label: React.ReactNode; value: string | number | boolean }>;
  selectProps: Record<string, any>;
  showSearch?: boolean;
  value?: unknown;
}) {
  const {
    allowClear,
    autoSelectFirstOption,
    disabled,
    form,
    namePath,
    onChange,
    options,
    selectProps,
    showSearch,
    value,
  } = props;
  const watchedValue = Form.useWatch(namePath, form);
  const currentValue = value ?? watchedValue;
  const {
    allowClear: _allowClear,
    filterOption: _filterOption,
    showSearch: _showSearch,
    ...restSelectProps
  } = selectProps;

  useEffect(() => {
    if (
      !autoSelectFirstOption ||
      (currentValue !== undefined && currentValue !== null && currentValue !== '') ||
      !options.length
    ) {
      return;
    }
    const firstValue = options[0].value;
    form.setFieldValue(namePath, firstValue);
    onChange?.(firstValue, options[0]);
  }, [autoSelectFirstOption, currentValue, form, namePath, onChange, options]);

  return (
    <Select
      allowClear={allowClear}
      disabled={disabled}
      options={options}
      showSearch={showSearch}
      value={value}
      onChange={onChange}
      {...restSelectProps}
      filterOption={(input, option) =>
        String((option as { label?: React.ReactNode } | undefined)?.label || '')
          .toLowerCase()
          .includes(input.toLowerCase())
      }
    />
  );
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
  const { token } = theme.useToken();
  const { availableValidationOptions, excludeValidationOptions, onChange, type, value } = props;
  const [expandedRuleKeys, setExpandedRuleKeys] = useState<string[]>([]);
  const rules = useMemo(() => value?.rules || [], [value?.rules]);
  const validationType = value?.type || type || 'string';
  const validationOptions = useMemo(() => {
    const allOptions = fieldValidationConfigureRegistry.getGroup(validationType);
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
      label: compileLegacyTemplate(option.label, t),
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
        const args = (option?.params || []).reduce<Record<string, unknown>>((memo, param) => {
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
  const handleToggleExpand = useCallback((key: string) => {
    setExpandedRuleKeys((prev) => (prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]));
  }, []);
  const renderParamControl = useCallback(
    (rule: (typeof rules)[number], param: NonNullable<FieldValidationConfigureItem['params']>[number]) => {
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
            options={(param.options || []).map((option) => ({
              label: compileLegacyTemplate(option.label, t),
              value: option.value,
            }))}
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
            options={(param.options || []).map((option) => ({
              label: compileLegacyTemplate(option.label, t),
              value: option.value,
            }))}
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
      {rules.length > 0 && (
        <div
          style={{
            background: token.colorBgContainer,
            border: `1px solid ${token.colorBorderSecondary}`,
            borderRadius: token.borderRadius,
            marginBottom: token.marginSM,
            overflow: 'hidden',
          }}
        >
          {rules.map((rule, index) => {
            const option = getRuleOption(rule.name);
            const hasParams = !!(option?.hasValue && option.params?.length);
            const isExpanded = expandedRuleKeys.includes(rule.key);
            return (
              <div
                key={rule.key}
                style={{
                  borderBottom: index === rules.length - 1 ? undefined : `1px solid ${token.colorBorderSecondary}`,
                }}
              >
                <div
                  style={{
                    alignItems: 'center',
                    display: 'flex',
                    justifyContent: 'space-between',
                    minHeight: 40,
                    padding: `${token.paddingXS}px ${token.paddingSM}px`,
                  }}
                >
                  <Space size={token.marginXS}>
                    {hasParams ? (
                      <Button
                        aria-label={isExpanded ? t('Collapse') : t('Expand button')}
                        icon={isExpanded ? <DownOutlined /> : <RightOutlined />}
                        size="small"
                        type="text"
                        style={{
                          color: token.colorTextSecondary,
                          height: 18,
                          minWidth: 18,
                          padding: 0,
                          width: 18,
                        }}
                        onClick={() => handleToggleExpand(rule.key)}
                      />
                    ) : (
                      <span style={{ display: 'inline-block', width: 18 }} />
                    )}
                    <span>
                      {option?.label
                        ? compileLegacyTemplate(option.label, t)
                        : compileLegacyTemplate(formatFallbackRuleLabel(rule.name), t)}
                    </span>
                  </Space>
                  <Button
                    aria-label={t('Delete')}
                    icon={<DeleteOutlined />}
                    size="small"
                    type="text"
                    style={{ color: token.colorTextSecondary }}
                    onClick={() => handleRemove(rule.key)}
                  />
                </div>
                {hasParams && isExpanded ? (
                  <div
                    style={{
                      background: token.colorFillQuaternary,
                      borderTop: `1px solid ${token.colorBorderSecondary}`,
                      padding: token.paddingSM,
                    }}
                  >
                    {option.params.map((param, index) => (
                      <Form.Item
                        key={param.key}
                        label={compileLegacyTemplate(param.label, t)}
                        required={!!param.required}
                        style={{ marginBottom: index === option.params.length - 1 ? 0 : token.marginSM }}
                      >
                        {renderParamControl(rule, param)}
                      </Form.Item>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
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

function DateTimeFormatPreview(props: { content?: React.ReactNode }) {
  const { token } = theme.useToken();

  if (!props.content) {
    return null;
  }

  return (
    <span
      style={{
        background: token.colorBgTextHover,
        borderRadius: token.borderRadiusOuter,
        display: 'inline-block',
        lineHeight: 1,
        marginLeft: token.marginMD,
        padding: token.paddingXXS,
      }}
    >
      {props.content}
    </span>
  );
}

function DateTimeFormatOption(props: { format: string }) {
  return (
    <span style={{ display: 'inline-flex' }}>
      <span>{props.format}</span>
      <DateTimeFormatPreview content={dayjs().format(props.format)} />
    </span>
  );
}

function NativeExpiresRadio(props: {
  defaultValue?: string;
  disabled?: boolean;
  formats?: string[];
  onChange?: (value?: string) => void;
  options: Array<{ label?: React.ReactNode; value?: string | number | boolean }>;
  picker?: string;
  value?: string;
}) {
  const formats = useMemo(() => props.formats || [], [props.formats]);
  const isCustomValue = !!props.value && !formats.includes(props.value);
  const [targetValue, setTargetValue] = useState(isCustomValue ? props.value : props.defaultValue || formats[0] || '');

  useEffect(() => {
    const nextIsCustom = !!props.value && !formats.includes(props.value);
    setTargetValue(nextIsCustom ? props.value : props.defaultValue || formats[0] || '');
  }, [formats, props.defaultValue, props.value]);

  return (
    <Radio.Group
      disabled={props.disabled}
      value={isCustomValue ? 'custom' : props.value}
      onChange={(event) => {
        if (event.target.value === 'custom') {
          props.onChange?.(targetValue);
          return;
        }
        props.onChange?.(event.target.value);
      }}
    >
      <Space direction="vertical">
        {props.options.map((option) => {
          if (option.value === 'custom') {
            return (
              <Radio key="custom" value="custom" style={{ display: 'flex', margin: '5px 0' }}>
                <Input
                  disabled={props.disabled}
                  style={{ width: 150 }}
                  value={targetValue}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setTargetValue(nextValue);
                    props.onChange?.(nextValue || undefined);
                  }}
                />
                <DateTimeFormatPreview content={targetValue ? dayjs().format(targetValue) : null} />
              </Radio>
            );
          }

          if (props.picker && props.picker !== 'date') {
            return null;
          }

          const value = String(option.value);
          return (
            <Radio key={value} value={option.value} aria-label={value} style={{ display: 'flex', margin: '5px 0' }}>
              {React.isValidElement(option.label) ? (
                option.label
              ) : (
                <DateTimeFormatOption format={typeof option.label === 'string' ? option.label : value} />
              )}
            </Radio>
          );
        })}
      </Space>
    </Radio.Group>
  );
}

function FieldInterfaceSummary(props: {
  fieldInterface?: Record<string, any>;
  label: React.ReactNode;
  fallbackTitle: React.ReactNode;
}) {
  const { fallbackTitle, fieldInterface, label } = props;
  const t = useT();
  const { token } = theme.useToken();
  const styles = useMemo(
    () => ({
      container: {
        backgroundColor: token.colorFillAlter,
        marginBottom: token.marginLG,
        padding: token.paddingSM + token.paddingXXS,
      },
      title: {
        color: token.colorText,
      },
      description: {
        color: token.colorTextDescription,
        marginTop: token.marginXS,
      },
      tag: {
        background: 'none',
      },
    }),
    [
      token.colorFillAlter,
      token.colorText,
      token.colorTextDescription,
      token.marginLG,
      token.marginXS,
      token.paddingSM,
      token.paddingXXS,
    ],
  );

  return (
    <div style={styles.container}>
      <div style={styles.title}>
        {label}: <Tag style={styles.tag}>{compileLegacyTemplate(fieldInterface?.title || fallbackTitle, t)}</Tag>
      </div>
      {fieldInterface?.description ? (
        <div style={styles.description}>{compileLegacyTemplate(fieldInterface.description, t)}</div>
      ) : null}
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
  context: FieldConfigureRuntimeContext;
  collection: Record<string, any>;
  collections: Array<Record<string, any>>;
  configureProperties: Array<{ name: string; schema: any }>;
  fieldInterface: Record<string, any>;
  form: ReturnType<typeof Form.useForm>[0];
}) {
  const t = useT();
  const { collection, collections, components, context, form, name, schema } = props;
  const namePath = toNamePath(name);
  const component = schema?.['x-component'];
  const CustomComponent = component ? components?.[component] : undefined;
  const targetCollectionName = Form.useWatch('target', form);
  const autoCreateReverseField = Form.useWatch('autoCreateReverseField', form);
  const inputable = Form.useWatch('inputable', form);
  const uiSchemaEnum = Form.useWatch(['uiSchema', 'enum'], form);
  const formValues = Form.useWatch([], form) || form.getFieldsValue(true);
  const lastRuntimeStateSignatureRef = useRef<string>();
  const dynamicContext = useMemo(
    () => ({
      ...context,
      inputable: !!inputable,
      showReverseFieldConfig: !!autoCreateReverseField || !!form.getFieldValue(['reverseField', 'key']),
    }),
    [autoCreateReverseField, context, form, inputable],
  );
  const coreState = getCoreFieldConfigureState(name, formValues as Record<string, any>, dynamicContext);
  const runtimeStateSignature = useMemo(
    () => JSON.stringify([coreState?.hasValue, coreState?.value]),
    [coreState?.hasValue, coreState?.value],
  );
  const disabled = coreState.disabled ?? isTruthyExpression(schema?.['x-disabled'], dynamicContext);
  const hidden =
    !!coreState.hidden ||
    isTruthyExpression(schema?.['x-hidden'], dynamicContext) ||
    (schema?.['x-visible'] !== undefined && !isTruthyExpression(schema?.['x-visible'], dynamicContext)) ||
    (name.startsWith('reverseField.') && !dynamicContext.showReverseFieldConfig);
  const rawTitle = schema?.title;
  const rawContent = schema?.['x-content'];
  const title = compileLegacyTemplate(rawTitle || rawContent || name, t);
  const checkboxContent = compileLegacyTemplate(rawContent || rawTitle || name, t);
  const shouldRenderCheckboxWithLabel = !!rawTitle && !!rawContent && rawTitle !== rawContent;
  const tooltip = compileLegacyTemplate(schema?.description, t);
  const componentProps = {
    ...(schema?.['x-component-props'] || {}),
    ...(coreState.componentProps || {}),
  };
  const loadedCurrentCollection = collections.find((item) => item.name === collection.name);
  const currentCollectionFields =
    Array.isArray(collection.fields) && collection.fields.length
      ? collection.fields
      : loadedCurrentCollection?.fields || [];
  const targetCollection = collections.find((item) => item.name === targetCollectionName);
  const targetCollectionFields = targetCollection?.fields || [];

  useEffect(() => {
    if (!coreState.hasValue) {
      lastRuntimeStateSignatureRef.current = undefined;
      return;
    }
    if (lastRuntimeStateSignatureRef.current === runtimeStateSignature) {
      return;
    }
    lastRuntimeStateSignatureRef.current = runtimeStateSignature;
    if (get(form.getFieldsValue(true), namePath) === coreState.value) {
      return;
    }
    form.setFieldValue(namePath, coreState.value);
  }, [coreState.hasValue, coreState.value, form, namePath, runtimeStateSignature]);

  if (hidden) {
    return null;
  }

  if (name === 'defaultValue') {
    const optionsSource =
      coreState.dataSource ||
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
    if (shouldRenderCheckboxWithLabel) {
      return (
        <Form.Item
          name={namePath}
          label={title}
          valuePropName="checked"
          tooltip={tooltip}
          rules={schema?.required ? [{ required: true }] : undefined}
        >
          <Checkbox disabled={disabled}>{checkboxContent}</Checkbox>
        </Form.Item>
      );
    }

    return (
      <Form.Item name={namePath} valuePropName="checked" tooltip={tooltip}>
        <Checkbox disabled={disabled}>{checkboxContent}</Checkbox>
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

  if (component === 'ExpiresRadio') {
    const { defaultValue, formats, picker } = componentProps;

    return (
      <Form.Item
        name={namePath}
        label={title}
        tooltip={tooltip}
        rules={schema?.required ? [{ required: true }] : undefined}
      >
        <NativeExpiresRadio
          defaultValue={defaultValue}
          disabled={disabled}
          formats={formats}
          options={normalizeSchemaEnum(schema?.enum, t)}
          picker={picker}
        />
      </Form.Item>
    );
  }

  if (
    component === 'Select' ||
    component === 'CollectionSelect' ||
    component === 'RemoteSelect' ||
    component === 'TargetKey' ||
    component === 'SourceKey'
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
          : schema?.enum === '{{collections}}'
            ? getCollectionOptions(collections, t)
            : schema?.enum === fileCollectionEnum
              ? getFileCollectionOptions(collections, t)
              : component === 'CollectionSelect' || component === 'RemoteSelect'
                ? getCollectionOptions(collections, t)
                : normalizeSchemaEnum(schema?.enum, t);

    const { filter, multiple, ...selectProps } = componentProps;
    const resolvedSelectProps = {
      ...selectProps,
      mode: multiple ? 'multiple' : selectProps.mode,
    };
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
        <ConfigureSelectControl
          allowClear={component === 'SourceKey' ? false : selectProps.allowClear ?? true}
          autoSelectFirstOption={component === 'SourceKey'}
          disabled={disabled}
          form={form}
          namePath={namePath}
          options={filteredOptions}
          selectProps={resolvedSelectProps}
          showSearch={component === 'SourceKey' || resolvedSelectProps.showSearch}
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

function FieldConfigureItemEffect(props: {
  context: FieldConfigureRuntimeContext;
  form: ReturnType<typeof Form.useForm>[0];
  item: FieldConfigureItem;
}) {
  const values = Form.useWatch([], props.form) || props.form.getFieldsValue(true);
  const dependencyValues = useMemo(
    () => (props.item.dependencies || [props.item.name]).map((name) => get(values, name)),
    [props.item.dependencies, props.item.name, values],
  );
  const signature = useMemo(() => JSON.stringify(dependencyValues), [dependencyValues]);
  const lastSignatureRef = useRef<string>();

  useEffect(() => {
    if (!props.item.effect || lastSignatureRef.current === signature) {
      return;
    }
    lastSignatureRef.current = signature;
    props.item.effect(createConfigureRuntimeContext(props.form, values as Record<string, any>, props.context));
  }, [props.context, props.form, props.item, signature, values]);

  return null;
}

function FieldConfigureItemRenderer(props: {
  collection: Record<string, any>;
  collections: Array<Record<string, any>>;
  context: FieldConfigureRuntimeContext;
  configureProperties: ConfigureProperty[];
  fieldInterface: Record<string, any>;
  form: ReturnType<typeof Form.useForm>[0];
  item: FieldConfigureItem;
}) {
  const t = useT();
  const values = Form.useWatch([], props.form) || props.form.getFieldsValue(true);
  const runtimeContext = createConfigureRuntimeContext(props.form, values as Record<string, any>, props.context);
  const hidden = typeof props.item.hidden === 'function' ? props.item.hidden(runtimeContext) : props.item.hidden;
  const rawDisabled =
    typeof props.item.disabled === 'function' ? props.item.disabled(runtimeContext) : props.item.disabled;
  const disabled =
    typeof rawDisabled === 'string' ? evaluateFieldConfigureExpression(rawDisabled, runtimeContext) : rawDisabled;
  const Component = props.item.Component;
  const schema = {
    ...(props.item.schema || {}),
    ...buildConfigureItemSchema(props.item),
    'x-disabled': disabled,
  };

  if (typeof hidden === 'string' ? evaluateFieldConfigureExpression(hidden, runtimeContext) : hidden) {
    return <FieldConfigureItemEffect context={props.context} form={props.form} item={props.item} />;
  }

  if (Component) {
    return (
      <>
        <FieldConfigureItemEffect context={props.context} form={props.form} item={props.item} />
        <Component
          name={props.item.name}
          namePath={toNamePath(props.item.name)}
          schema={schema}
          form={props.form}
          disabled={disabled}
          collection={props.collection}
          collections={props.collections}
          context={props.context}
          title={compileLegacyTemplate(props.item.title, t)}
          tooltip={compileLegacyTemplate(props.item.description, t)}
          componentProps={props.item.componentProps}
          mode={props.context.createOnly ? 'create' : 'edit'}
          createOnly={props.context.createOnly}
          editMainOnly={props.context.editMainOnly}
          disabledJSONB={props.context.disabledJSONB}
          fieldInterface={props.fieldInterface}
        />
      </>
    );
  }

  return (
    <>
      <FieldConfigureItemEffect context={props.context} form={props.form} item={props.item} />
      <FieldConfigurePropertyItem
        name={props.item.name}
        schema={schema}
        collection={props.collection}
        collections={props.collections}
        configureProperties={props.configureProperties}
        fieldInterface={props.fieldInterface}
        form={props.form}
        context={props.context}
      />
    </>
  );
}

function FieldConfigureItemsRenderer(props: {
  collection: Record<string, any>;
  collections: Array<Record<string, any>>;
  context: FieldConfigureRuntimeContext;
  fieldInterface: Record<string, any>;
  form: ReturnType<typeof Form.useForm>[0];
  items: FieldConfigureItem[];
}) {
  const renderItem = (item: FieldConfigureItem) => (
    <FieldConfigureItemRenderer
      key={item.name}
      item={item}
      collection={props.collection}
      collections={props.collections}
      configureProperties={[]}
      fieldInterface={props.fieldInterface}
      form={props.form}
      context={props.context}
    />
  );

  const nodes: React.ReactNode[] = [];
  let index = 0;

  while (index < props.items.length) {
    const item = props.items[index];
    const row = item.layout?.row;

    if (!row) {
      nodes.push(renderItem(item));
      index += 1;
      continue;
    }

    const rowItems: FieldConfigureItem[] = [];
    while (index < props.items.length && props.items[index].layout?.row === row) {
      rowItems.push(props.items[index]);
      index += 1;
    }

    const columnItems = rowItems
      .reduce<Array<{ key: string; index: number; span: number; items: FieldConfigureItem[] }>>((memo, rowItem) => {
        const key = rowItem.layout?.column || rowItem.name;
        const existing = memo.find((column) => column.key === key);
        if (existing) {
          existing.items.push(rowItem);
          return memo;
        }
        memo.push({
          key,
          index: rowItem.layout?.columnIndex ?? memo.length,
          span: rowItem.layout?.span || 24,
          items: [rowItem],
        });
        return memo;
      }, [])
      .sort((a, b) => a.index - b.index);

    let previousColumnEnd = 0;

    nodes.push(
      <Row key={`${row}-${nodes.length}`} gutter={24}>
        {columnItems.map((column) => {
          const offset = Math.max(column.index - previousColumnEnd, 0) * column.span;
          previousColumnEnd = column.index + 1;
          return (
            <Col key={column.key} xs={24} md={{ span: column.span, offset }}>
              {column.items.map((rowItem) => renderItem(rowItem))}
            </Col>
          );
        })}
      </Row>,
    );
  }

  return <>{nodes}</>;
}

export function FieldForm(props: FieldFormProps) {
  const t = useT();
  const ctx = useFlowContext();
  const { notification } = App.useApp();
  const appInfo = useCurrentAppInfo<{ database?: { dialect?: string } }>();
  const fieldInterfaceManager = getFieldInterfaceManager(ctx);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const generatedFieldNameRef = useRef<string>();
  const lastInitialValuesKeyRef = useRef<string>();
  const dataSource = ctx.dataSourceManager.getDataSource(props.dataSourceKey);
  const databaseDialect = getAppInfoDatabaseDialect(appInfo);
  const fieldInterfaces = useMemo(() => {
    const allFieldInterfaces = getFieldInterfaces(ctx, dataSource?.options?.type);
    if (props.mode !== 'create') {
      return allFieldInterfaces;
    }
    return filterFieldInterfacesByTemplate(allFieldInterfaces, props.collection, ctx, databaseDialect);
  }, [databaseDialect, ctx, dataSource?.options?.type, props.collection, props.mode]);
  const creatableFieldInterfaces = useMemo(
    () =>
      props.mode === 'create'
        ? filterCreateFieldInterfacesByTemplate(fieldInterfaces, props.collection, ctx)
        : fieldInterfaces,
    [ctx, fieldInterfaces, props.collection, props.mode],
  );
  const [interfaceName, setInterfaceName] = useState(
    props.field?.interface || props.interfaceName || creatableFieldInterfaces[0]?.name,
  );
  const fieldInterface = useMemo(
    () => fieldInterfaces.find((item) => item.name === interfaceName),
    [fieldInterfaces, interfaceName],
  );
  const configure = useMemo(
    () =>
      interfaceName ? fieldInterfaceManager?.getFieldInterfaceConfigure?.(interfaceName, props.collection) : undefined,
    [fieldInterfaceManager, interfaceName, props.collection],
  );
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
  const fieldConfigureItems = useMemo(() => configure?.items || [], [configure?.items]);
  const { mainConfigureItems, validationConfigureItems } = useMemo(
    () => splitValidationConfigureItems(fieldConfigureItems, !!fieldInterfaceOptions?.isAssociation),
    [fieldConfigureItems, fieldInterfaceOptions?.isAssociation],
  );
  const [collections, setCollections] = useState<Array<Record<string, any>>>([]);
  const needsCollectionOptions = useMemo(
    () =>
      fieldConfigureItems.some(
        (item) =>
          relationCollectionPropertyNames.has(item.name) ||
          item.schema?.enum === '{{collections}}' ||
          item.schema?.enum === fileCollectionEnum ||
          item.component === 'CollectionSelect' ||
          item.component === 'RemoteSelect',
      ),
    [fieldConfigureItems],
  );
  const rendersStorageType = useMemo(
    () => fieldConfigureItems.some((item) => item.name === 'type'),
    [fieldConfigureItems],
  );
  const initialValues = useMemo(() => {
    const values = toInitialValues(fieldInterfaceOptions, props.field, t);
    if (!props.field) {
      if (!generatedFieldNameRef.current) {
        generatedFieldNameRef.current = values.name || randomId('f_');
      }
      values.name = generatedFieldNameRef.current;
      applyItemDefaults(values, fieldConfigureItems);
      if ((fieldInterface?.isAssociation || configure?.isAssociation) && !get(values, 'source')) {
        set(values, 'source', props.collection.name);
      }
    }
    return values;
  }, [
    configure?.isAssociation,
    fieldConfigureItems,
    fieldInterface?.isAssociation,
    fieldInterfaceOptions,
    props.collection.name,
    props.field,
    t,
  ]);
  const initialValuesKey = useMemo(
    () =>
      buildInitialValuesKey({
        mode: props.mode,
        dataSourceKey: props.dataSourceKey,
        collectionName: props.collection.name,
        fieldName: props.field?.name,
        interfaceName,
      }),
    [interfaceName, props.collection.name, props.dataSourceKey, props.field?.name, props.mode],
  );
  const fieldConfigureContext = useMemo<FieldConfigureRuntimeContext>(
    () => ({
      createOnly: props.mode === 'create',
      editMainOnly: props.mode === 'edit',
      createMainOnly: props.mode === 'create' && props.dataSourceKey === 'main',
      disabledJSONB: props.mode === 'edit',
      isDialect: (dialect: string) => databaseDialect === dialect,
      isOverride: !!props.override,
      override: !!props.override,
      primaryKeyOnly: false,
    }),
    [databaseDialect, props.dataSourceKey, props.mode, props.override],
  );
  const previousWatchedValuesRef = useRef<Record<string, any>>();
  const pendingInitialValuesRef = useRef<Record<string, any>>();

  useEffect(() => {
    if (lastInitialValuesKeyRef.current === initialValuesKey) {
      return;
    }
    lastInitialValuesKeyRef.current = initialValuesKey;
    pendingInitialValuesRef.current = cloneDeep(initialValues);
    previousWatchedValuesRef.current = cloneDeep(initialValues);
    form.resetFields();
    form.setFieldsValue(initialValues);
  }, [form, initialValues, initialValuesKey]);

  const watchedValues = Form.useWatch([], form) || form.getFieldsValue(true);
  const watchedValuesSignature = useMemo(() => JSON.stringify(watchedValues), [watchedValues]);

  useEffect(() => {
    if (pendingInitialValuesRef.current) {
      const pendingInitialValues = pendingInitialValuesRef.current;
      const initialValuesReady =
        get(watchedValues, 'name') === get(pendingInitialValues, 'name') &&
        get(watchedValues, 'interface') === get(pendingInitialValues, 'interface') &&
        get(watchedValues, 'type') === get(pendingInitialValues, 'type');
      if (!initialValuesReady) {
        return;
      }
      pendingInitialValuesRef.current = undefined;
      previousWatchedValuesRef.current = cloneDeep(watchedValues as Record<string, any>);
      runCoreFieldConfigureEffects(
        createConfigureRuntimeContext(form, watchedValues as Record<string, any>, fieldConfigureContext),
      );
      return;
    }
    const previousValues = previousWatchedValuesRef.current || {};
    if (!previousWatchedValuesRef.current) {
      previousWatchedValuesRef.current = cloneDeep(watchedValues as Record<string, any>);
      runCoreFieldConfigureEffects(
        createConfigureRuntimeContext(form, watchedValues as Record<string, any>, fieldConfigureContext),
      );
      return;
    }
    const changedName = [
      'primaryKey',
      'unique',
      'autoIncrement',
      'autoCreateReverseField',
      'defaultToCurrentTime',
      'uiSchema.x-component-props.picker',
      'uiSchema.x-component-props.showTime',
    ].find((name) => get(previousValues, name) !== get(watchedValues, name));
    previousWatchedValuesRef.current = cloneDeep(watchedValues as Record<string, any>);
    runCoreFieldConfigureEffects(
      createConfigureRuntimeContext(form, watchedValues as Record<string, any>, fieldConfigureContext, changedName),
    );
  }, [fieldConfigureContext, form, watchedValues, watchedValuesSignature]);

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
    if (!interfaceName && creatableFieldInterfaces[0]?.name) {
      setInterfaceName(creatableFieldInterfaces[0].name);
    }
  }, [creatableFieldInterfaces, interfaceName, props.interfaceName]);

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
      const nextValues = toInitialValues(nextOptions, undefined, t);
      applyItemDefaults(nextValues, nextConfigure?.items || []);
      if ((nextFieldInterface?.isAssociation || nextConfigure?.isAssociation) && !get(nextValues, 'source')) {
        set(nextValues, 'source', props.collection.name);
      }
      if (currentTitle) {
        set(nextValues, 'uiSchema.title', currentTitle);
      }
      const currentName = form.getFieldValue('name');
      if (form.isFieldTouched('name') && currentName) {
        set(nextValues, 'name', currentName);
      } else {
        if (!generatedFieldNameRef.current) {
          generatedFieldNameRef.current = nextValues.name || randomId('f_');
        }
        set(nextValues, 'name', generatedFieldNameRef.current);
      }
      lastInitialValuesKeyRef.current = buildInitialValuesKey({
        mode: props.mode,
        dataSourceKey: props.dataSourceKey,
        collectionName: props.collection.name,
        interfaceName: nextInterface,
      });
      setInterfaceName(nextInterface);
      form.resetFields();
      form.setFieldsValue(nextValues);
    },
    [fieldInterfaceManager, fieldInterfaces, form, props.collection, props.dataSourceKey, props.mode, t],
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
    try {
      const currentValues = form.getFieldsValue(true);
      if (
        props.mode === 'create' &&
        !form.isFieldTouched('name') &&
        shouldRegenerateUntouchedFieldName(currentValues, fieldInterfaceTitleText)
      ) {
        if (!generatedFieldNameRef.current) {
          generatedFieldNameRef.current = randomId('f_');
        }
        form.setFieldValue('name', generatedFieldNameRef.current);
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
    } catch (error) {
      if (!isFormValidationError(error)) {
        notification.error({
          message: getErrorMessage(error, t('Submit failed')),
        });
      }
      throw error;
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
    notification,
    props,
    t,
  ]);

  const collectionTitle = compileLegacyTemplateText(get(props.collection, 'title') || props.collection.name, t);
  const title = `${collectionTitle} - ${
    props.override ? t('Override field') : props.mode === 'create' ? t('Add field') : t('Edit field')
  }`;
  const existingFieldNames = new Set((props.collection.fields || []).map((field: Record<string, any>) => field.name));

  return (
    <DrawerFormLayout
      title={title}
      onSubmit={handleSubmit}
      submitting={submitting}
      submitText={t('Submit')}
      cancelText={t('Cancel')}
    >
      <Form form={form} layout="vertical" initialValues={initialValues} autoComplete="off">
        <FieldInterfaceSummary
          fieldInterface={fieldInterfaceOptions}
          label={t('Field interface')}
          fallbackTitle={fieldInterfaceTitle}
        />
        {!props.interfaceName && props.mode === 'create' ? (
          <Form.Item name="interface" label={t('Field interface')} rules={[{ required: true }]}>
            <Select
              options={creatableFieldInterfaces.map((item) => ({
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
          <Input autoComplete="off" />
        </Form.Item>
        <Form.Item
          name="name"
          label={t('Field name')}
          rules={[
            { required: true },
            {
              pattern: interfaceName === 'tableoid' ? /^__collection$/ : fieldNamePattern,
              message: t(fieldNameDescription),
            },
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
          <Input
            autoComplete="off"
            disabled={props.mode === 'edit' || props.override || interfaceName === 'tableoid'}
          />
        </Form.Item>
        <FieldConfigureItemsRenderer
          items={mainConfigureItems}
          collection={props.collection}
          collections={collections}
          fieldInterface={fieldInterfaceOptions}
          form={form}
          context={fieldConfigureContext}
        />
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
        <FieldConfigureItemsRenderer
          items={validationConfigureItems}
          collection={props.collection}
          collections={collections}
          fieldInterface={fieldInterfaceOptions}
          form={form}
          context={fieldConfigureContext}
        />
        <Form.Item name="description" label={t('Description')}>
          <Input.TextArea autoSize={{ minRows: 4, maxRows: 8 }} />
        </Form.Item>
      </Form>
    </DrawerFormLayout>
  );
}
