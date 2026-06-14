/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  DeleteOutlined,
  DownOutlined,
  ExclamationCircleFilled,
  FilterOutlined,
  ImportOutlined,
  PlusOutlined,
  ReloadOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import {
  DEFAULT_PAGE_SIZE,
  DrawerFormLayout,
  FilterContent,
  SortableCategoryTabs,
  Table,
  normalizeCollectionTemplateFields,
} from '@nocobase/client-v2';
import type { CollectionTemplateField } from '@nocobase/client-v2';
import { observable, observer, randomId, useFlowContext } from '@nocobase/flow-engine';
import { transformFilter } from '@nocobase/utils/client';
import type { FilterGroupType } from '@nocobase/utils/client';
import { useRequest } from 'ahooks';
import {
  App,
  Button,
  Card,
  Checkbox,
  Drawer,
  Dropdown,
  Flex,
  Form,
  Input,
  Modal,
  Popover,
  Select,
  Space,
  Spin,
  Tag,
  theme,
  Transfer,
} from 'antd';
import type { FormInstance } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FC } from 'react';
import { useT } from '../../locale';
import type { CollectionPresetFieldOptions, CollectionTemplateOptions } from '../../plugin';
import { PluginDataSourceManagerClientV2 } from '../../plugin';
import { compileLegacyTemplate, preferLegacyTemplateTitle } from '../../utils/compileLegacyTemplate';
import { getErrorMessage, isFormValidationError } from '../../utils/error';
import { getCollectionFieldActionUrl } from './collectionFieldApi';
import FieldsPage from './FieldsPage';

interface CollectionsPageProps {
  dataSourceKey: string;
  title?: React.ReactNode;
}

type CollectionCategoryRecord = {
  id: number | string;
  name?: React.ReactNode;
  color?: string;
  sort?: number;
};

type CollectionFormValues = {
  title: string;
  name: string;
  template: string;
  category?: Array<number | string>;
  description?: string;
  fields?: CollectionTemplateField[];
};

type TableItem = {
  key: string;
  name: string;
  title: string;
  description?: string;
};

type FilterGroupValue = {
  logic: '$and' | '$or';
  items: Array<CollectionFilterItemValue | FilterGroupValue>;
};

type CollectionFilterItemValue = {
  path: string;
  operator: string;
  value: string | undefined;
};

type CollectionFilterPayload = Record<string, unknown> | undefined;

type CollectionFilterField = {
  name: 'title' | 'name' | 'template' | 'description';
  title: string;
  operators: Array<{ value: string; label: string }>;
  RenderValue: FC<{
    value: string | undefined;
    onChange: (value: string | undefined) => void;
  }>;
};

const colorOptions = ['default', 'red', 'orange', 'yellow', 'green', 'cyan', 'blue', 'purple'];
const colorLabels: Record<string, string> = {
  default: 'Default',
  red: 'Red',
  orange: 'Orange',
  yellow: 'Yellow',
  green: 'Green',
  cyan: 'Cyan',
  blue: 'Blue',
  purple: 'Purple',
};

function createEmptyFilter(): FilterGroupValue {
  return observable({ logic: '$and', items: [] }) as FilterGroupValue;
}

function getTextFilterOperators(t: (key: string) => string) {
  return [
    { value: '$includes', label: t('contains') },
    { value: '$notIncludes', label: t('does not contain') },
    { value: '$eq', label: t('is') },
    { value: '$ne', label: t('is not') },
  ];
}

const TextFilterInput: CollectionFilterField['RenderValue'] = ({ value, onChange }) => (
  <Input style={{ minWidth: 180 }} value={value ?? ''} onChange={(event) => onChange(event.target.value)} />
);

const TemplateFilterSelect: CollectionFilterField['RenderValue'] = ({ value, onChange }) => {
  const t = useT();
  const ctx = useFlowContext();
  const plugin = ctx.app.pm.get(PluginDataSourceManagerClientV2);
  const templateOptions = plugin.getCollectionTemplates();

  return (
    <Select
      style={{ minWidth: 220 }}
      value={value}
      options={templateOptions.map((option) => ({
        value: option.name,
        label: compileLegacyTemplate(option.title, t),
      }))}
      onChange={(next) => onChange(next)}
      allowClear
    />
  );
};

function useCollectionFilterFields() {
  const t = useT();

  return useMemo<CollectionFilterField[]>(
    () => [
      {
        name: 'title',
        title: t('Collection display name'),
        operators: getTextFilterOperators(t),
        RenderValue: TextFilterInput,
      },
      {
        name: 'name',
        title: t('Collection name'),
        operators: getTextFilterOperators(t),
        RenderValue: TextFilterInput,
      },
      {
        name: 'template',
        title: t('Collection template'),
        operators: [
          { value: '$eq', label: t('is') },
          { value: '$ne', label: t('is not') },
        ],
        RenderValue: TemplateFilterSelect,
      },
      {
        name: 'description',
        title: t('Description'),
        operators: getTextFilterOperators(t),
        RenderValue: TextFilterInput,
      },
    ],
    [t],
  );
}

function normalizeListResponse(response: any) {
  const body = response?.data;
  const payload = body?.data;
  const records = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
  const meta = body?.meta || payload?.meta || {};

  return {
    records,
    total: meta.count || meta.total || records.length,
  };
}

function updateCollectionListRecord(
  data: { records: Record<string, any>[]; total: number } | undefined,
  collectionName: string,
  values: Record<string, any>,
) {
  if (!data?.records) {
    return data;
  }

  return {
    ...data,
    records: data.records.map((collection) =>
      collection.name === collectionName ? { ...collection, ...values } : collection,
    ),
  };
}

function normalizeArrayResponse(response: any) {
  const payload = response?.data?.data;
  return Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
}

function getVisibleCollectionFilter() {
  return {
    hidden: {
      $isFalsy: true,
    },
  };
}

function normalizeCategoryFilterValue(categoryKey: string) {
  const numericValue = Number(categoryKey);
  if (Number.isSafeInteger(numericValue) && String(numericValue) === categoryKey) {
    return numericValue;
  }
  return categoryKey;
}

function buildCollectionListFilter(options: {
  activeCategoryKey: string;
  filterPayload?: CollectionFilterPayload;
  isMainDataSource: boolean;
}) {
  const filterItems: Array<Record<string, unknown>> = [getVisibleCollectionFilter()];

  if (options.isMainDataSource && options.activeCategoryKey !== 'all') {
    filterItems.push({ 'category.id': normalizeCategoryFilterValue(options.activeCategoryKey) });
  }

  if (options.filterPayload) {
    filterItems.push(options.filterPayload);
  }

  return filterItems.length > 1 ? { $and: filterItems } : filterItems[0];
}

function getCollectionTemplateLabel(
  t: (key: string) => string,
  plugin: PluginDataSourceManagerClientV2,
  value?: string,
) {
  const template = value || 'general';
  const option = plugin.getCollectionTemplate(template);

  if (option) {
    return compileLegacyTemplate(option.title, t);
  }

  return template;
}

function renderCategoryTags(value: CollectionCategoryRecord[] | undefined, t: (key: string) => string) {
  if (!Array.isArray(value) || !value.length) {
    return null;
  }

  return (
    <Space size={[4, 4]} wrap>
      {value.map((item) => (
        <Tag key={item.id} color={item.color === 'default' ? undefined : item.color}>
          {compileLegacyTemplate(item.name || item.id, t)}
        </Tag>
      ))}
    </Space>
  );
}

function normalizeFilterTargetKey(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter(Boolean).map(String);
  }

  return value ? [String(value)] : undefined;
}

function getCollectionFilterTargetKey(collection: Record<string, any>) {
  const configuredFilterTargetKey = normalizeFilterTargetKey(collection.filterTargetKey);
  if (configuredFilterTargetKey?.length) {
    return configuredFilterTargetKey;
  }

  if (!Array.isArray(collection.fields)) {
    return undefined;
  }

  const primaryKeys = collection.fields
    .filter((field) => field?.primaryKey && field?.name)
    .map((field) => String(field.name));

  return primaryKeys.length === 1 ? primaryKeys : undefined;
}

const CollectionFilterItem: FC<{ value: CollectionFilterItemValue }> = observer(
  ({ value }) => {
    const t = useT();
    const fields = useCollectionFilterFields();
    const currentField = fields.find((field) => field.name === value.path);
    const operatorOptions = currentField?.operators ?? [];
    const RenderValue = currentField?.RenderValue ?? TextFilterInput;
    const fieldOptions = useMemo(() => fields.map((field) => ({ value: field.name, label: field.title })), [fields]);

    return (
      <Space style={{ flex: 1 }} wrap>
        <Select
          style={{ minWidth: 180 }}
          placeholder={t('Select field')}
          value={value.path || undefined}
          options={fieldOptions}
          onChange={(next: CollectionFilterField['name']) => {
            const nextField = fields.find((field) => field.name === next);
            value.path = next;
            value.operator = nextField?.operators[0]?.value ?? '';
            value.value = undefined;
          }}
        />
        <Select
          style={{ minWidth: 140 }}
          placeholder={t('Comparison')}
          value={value.operator || undefined}
          options={operatorOptions}
          disabled={!value.path}
          onChange={(next: string) => {
            value.operator = next;
            value.value = undefined;
          }}
        />
        <RenderValue value={value.value} onChange={(next) => (value.value = next)} />
      </Space>
    );
  },
  { displayName: 'CollectionFilterItem' },
);

const CollectionFilterPopover: FC<{
  value: FilterGroupValue;
  onSubmit: () => void;
  onReset: () => void;
}> = observer(
  ({ value, onSubmit, onReset }) => {
    const t = useT();
    const [open, setOpen] = useState(false);
    const filterContext = useMemo(
      () => ({
        model: {
          translate: (key: string) => t(key),
          dispatchEvent: (eventName: string) => {
            if (eventName === 'submit') {
              onSubmit();
              setOpen(false);
            }
            if (eventName === 'reset') {
              onReset();
            }
          },
        },
      }),
      [onReset, onSubmit, t],
    );
    const conditionCount = value.items.length;
    const label = conditionCount
      ? t('{{count}} filter items').replace('{{count}}', String(conditionCount))
      : t('Filter');

    return (
      <Popover
        open={open}
        onOpenChange={setOpen}
        trigger="click"
        placement="bottomLeft"
        content={
          <div style={{ minWidth: 560 }}>
            <FilterContent value={value} ctx={filterContext} FilterItem={CollectionFilterItem} />
          </div>
        }
      >
        <Button icon={<FilterOutlined />} type={conditionCount ? 'primary' : 'default'}>
          {label}
        </Button>
      </Popover>
    );
  },
  { displayName: 'CollectionFilterPopover' },
);

type PresetFieldRow = {
  name: string;
  field: React.ReactNode;
  interfaceLabel: React.ReactNode;
  description?: React.ReactNode;
};

function getPresetFieldName(field: CollectionPresetFieldOptions) {
  return field.name || field.value.name;
}

export function getPresetFieldRows(
  presetFields: CollectionPresetFieldOptions[],
  fieldInterfaceManager?: { getFieldInterface?: (name: string) => { title?: React.ReactNode } | undefined },
): PresetFieldRow[] {
  return presetFields.map((field) => {
    const fieldInterface = field.value.interface
      ? fieldInterfaceManager?.getFieldInterface?.(field.value.interface)
      : undefined;
    const templateTitle = field.value.uiSchema?.title || fieldInterface?.title;
    const fieldTitle = field.field || field.value.uiSchema?.title || field.value.name;
    const interfaceLabel = field.interfaceLabel || fieldInterface?.title || field.value.interface || field.value.type;
    return {
      name: getPresetFieldName(field),
      field: preferLegacyTemplateTitle(fieldTitle, templateTitle),
      interfaceLabel: preferLegacyTemplateTitle(interfaceLabel, fieldInterface?.title),
      description: field.description,
    };
  });
}

function buildPresetFields(selectedFieldNames: React.Key[], presetFields: CollectionPresetFieldOptions[]) {
  const selected = new Set(selectedFieldNames.map(String));
  return presetFields
    .filter((field) => selected.has(getPresetFieldName(field)))
    .map((field) => structuredClone(field.value));
}

function normalizeCollectionCategoryValue(category?: Array<number | string>) {
  return category?.map((value) => {
    if (typeof value !== 'string') {
      return value;
    }
    const numericValue = Number(value);
    if (Number.isSafeInteger(numericValue) && String(numericValue) === value) {
      return numericValue;
    }
    return value;
  });
}

function getDatabaseViewFormValue(collection: Record<string, any>) {
  const viewName = collection.viewName || collection.name;
  if (!viewName) {
    return undefined;
  }
  return collection.schema ? `${collection.schema}@${viewName}` : viewName;
}

function resolveTemplateDefaultValues(template: CollectionTemplateOptions) {
  return typeof template.defaultValues === 'function' ? template.defaultValues() : template.defaultValues || {};
}

function resolveTemplateCollectionOptions(template: CollectionTemplateOptions) {
  const options = template.collection?.options;
  if (typeof options === 'function') {
    return options();
  }
  return options || resolveTemplateDefaultValues(template);
}

function resolveTemplateCollectionFields(template: CollectionTemplateOptions) {
  const fields = template.collection?.fields;
  if (typeof fields === 'function') {
    return fields();
  }
  return fields || [];
}

function getTemplatePresetFieldsDisabled(template: CollectionTemplateOptions) {
  return template.presetFields?.disabled ?? template.presetFieldsDisabled;
}

function getTemplatePresetFieldsDisabledIncludes(template: CollectionTemplateOptions) {
  return template.presetFields?.disabledIncludes || template.presetFieldsDisabledIncludes || [];
}

function hasTemplateCapability(
  template: CollectionTemplateOptions | undefined,
  capability: keyof NonNullable<CollectionTemplateOptions['capabilities']>,
) {
  return !!template?.capabilities?.[capability];
}

function supportsTemplateInherits(template: CollectionTemplateOptions | undefined) {
  return template?.capabilities?.inherits !== false;
}

const CollectionTemplatePreview: FC<{ template?: CollectionTemplateOptions }> = ({ template }) => {
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

  if (!template) {
    return null;
  }

  return (
    <div style={styles.container}>
      <div style={styles.title}>
        {t('Collection template')}: <Tag style={styles.tag}>{compileLegacyTemplate(template.title, t)}</Tag>
      </div>
      {template.description ? (
        <div style={styles.description}>{compileLegacyTemplate(template.description, t)}</div>
      ) : null}
    </div>
  );
};

function buildCollectionCreateValues(options: {
  template: CollectionTemplateOptions;
  formValues: CollectionFormValues;
  selectedPresetFields: React.Key[];
  presetFields: CollectionPresetFieldOptions[];
  fieldInterfaceManager?: any;
}) {
  const { fieldInterfaceManager, formValues, presetFields, selectedPresetFields, template } = options;
  const templateOptions = resolveTemplateCollectionOptions(template);
  const legacyTemplateFields = Array.isArray(templateOptions.fields) ? templateOptions.fields : [];
  const formFields = normalizeCollectionTemplateFields(
    Array.isArray(formValues.fields) ? formValues.fields : [],
    fieldInterfaceManager,
    {
      collectionInfo: {
        ...templateOptions,
        ...formValues,
        template: template.name,
      },
    },
  );
  const templateFields = normalizeCollectionTemplateFields(
    [...legacyTemplateFields, ...resolveTemplateCollectionFields(template)],
    fieldInterfaceManager,
    {
      collectionInfo: {
        ...templateOptions,
        ...formValues,
        template: template.name,
      },
    },
  );

  const values: Record<string, any> = {
    autoGenId: false,
    view: false,
    ...templateOptions,
    ...formValues,
    template: template.name,
    logging: true,
    category: normalizeCollectionCategoryValue(formValues.category),
    fields: [...templateFields, ...buildPresetFields(selectedPresetFields, presetFields), ...formFields],
  };

  const transformedValues = template.configure?.transformSubmitValues?.(values);
  if (transformedValues) {
    return transformedValues;
  }

  template.beforeSubmit?.(values);
  return values;
}

const CollectionTemplateConfigureItems: FC<{
  mode: 'create' | 'edit';
  template: CollectionTemplateOptions;
  form: any;
}> = ({ form, mode, template }) => {
  const t = useT();
  const items = template.configure?.items || [];

  if (!items.length) {
    return null;
  }

  return (
    <>
      {items.map((item, index) => {
        const hidden = typeof item.hidden === 'function' ? item.hidden({ mode, template, form }) : Boolean(item.hidden);
        const Component = item.Component;

        if (hidden || !Component) {
          if (hidden || !item.name) {
            return null;
          }
          const label = compileLegacyTemplate(item.label || item.name, t);
          const rules = item.required ? [{ required: true }] : undefined;
          const componentProps = item.componentProps || {};
          let child: React.ReactNode = <Input {...componentProps} />;

          if (item.component === 'Input.TextArea') {
            child = <Input.TextArea autoSize={{ minRows: 3, maxRows: 8 }} {...componentProps} />;
          }
          if (item.component === 'Select') {
            child = (
              <Select
                options={(item.options || []).map((option) => ({
                  value: option.value,
                  label: compileLegacyTemplate(option.label, t),
                }))}
                {...componentProps}
              />
            );
          }
          if (item.component === 'Checkbox') {
            return (
              <Form.Item key={item.name || index} name={item.name} valuePropName="checked" rules={rules}>
                <Checkbox {...componentProps}>{label}</Checkbox>
              </Form.Item>
            );
          }

          return (
            <Form.Item key={item.name || index} name={item.name} label={label} rules={rules}>
              {child}
            </Form.Item>
          );
        }

        if (!Component) {
          return null;
        }

        return <Component key={item.name || index} mode={mode} template={template} form={form} item={item} />;
      })}
    </>
  );
};

const CollectionCreateFilterTargetKey: FC<{
  form: FormInstance<CollectionFormValues>;
}> = ({ form }) => {
  const t = useT();
  const fields = Form.useWatch('fields', form);
  const options = useMemo(
    () =>
      (Array.isArray(fields) ? fields : [])
        .filter((field) => field?.name)
        .map((field) => ({
          value: field.name,
          label: compileLegacyTemplate((field.uiSchema?.title || field.title || field.name) as React.ReactNode, t),
        })),
    [fields, t],
  );

  return (
    <Form.Item
      name="filterTargetKey"
      label={t('Record unique key')}
      extra={t(
        'If a collection lacks a primary key, you must configure a unique record key to locate row records within a block, failure to configure this will prevent the creation of data blocks for the collection.',
      )}
    >
      <Select mode="multiple" options={options} allowClear />
    </Form.Item>
  );
};

function CollectionCreateDrawer(props: {
  template: CollectionTemplateOptions;
  categories: CollectionCategoryRecord[];
  activeCategoryKey: string;
  onSubmitted: () => void;
}) {
  const { activeCategoryKey, categories, onSubmitted, template } = props;
  const t = useT();
  const ctx = useFlowContext();
  const { notification } = App.useApp();
  const plugin = ctx.app.pm.get(PluginDataSourceManagerClientV2);
  const [form] = Form.useForm<CollectionFormValues>();
  const collectionPresetFields = useMemo(() => plugin.getCollectionPresetFields(), [plugin]);
  const [submitting, setSubmitting] = useState(false);
  const isSqlTemplate = template.name === 'sql';
  const isViewTemplate = template.name === 'view';
  const [selectedPresetFields, setSelectedPresetFields] = useState<React.Key[]>(() =>
    isSqlTemplate || isViewTemplate
      ? []
      : collectionPresetFields
          .filter((field) => field.defaultSelected !== false)
          .map((field) => getPresetFieldName(field)),
  );
  const collectionRequest = useRequest(async () => {
    const response = await ctx.api.request({
      url: 'dataSources/main/collections:list',
      params: {
        paginate: false,
        sort: ['sort'],
        filter: JSON.stringify(getVisibleCollectionFilter()),
      },
    });
    return normalizeArrayResponse(response) as Array<Record<string, string>>;
  });
  const collectionOptions = useMemo(
    () =>
      (collectionRequest.data || [])
        .filter((collection) => collection.name)
        .map((collection) => ({
          value: collection.name,
          label: compileLegacyTemplate(collection.title || collection.name, t),
        })),
    [collectionRequest.data, t],
  );
  const initialValues = useMemo(
    () => ({
      ...resolveTemplateCollectionOptions(template),
      template: template.name,
      name: randomId('t_'),
      category: activeCategoryKey === 'all' ? [] : [activeCategoryKey],
    }),
    [activeCategoryKey, template],
  );
  const disabledPresetFields = useMemo(() => new Set(getTemplatePresetFieldsDisabledIncludes(template)), [template]);
  const presetFieldRows = useMemo(
    () => getPresetFieldRows(collectionPresetFields, ctx.dataSourceManager.collectionFieldInterfaceManager),
    [collectionPresetFields, ctx.dataSourceManager.collectionFieldInterfaceManager],
  );
  const presetColumns = useMemo<ColumnsType<PresetFieldRow>>(
    () => [
      {
        title: t('Field'),
        dataIndex: 'field',
        render: (value) => compileLegacyTemplate(value, t),
      },
      {
        title: t('Interface'),
        dataIndex: 'interfaceLabel',
        render: (value) => <Tag>{compileLegacyTemplate(value, t)}</Tag>,
      },
      {
        title: t('Description'),
        dataIndex: 'description',
        render: (value) => compileLegacyTemplate(value, t),
      },
    ],
    [t],
  );
  const TemplateConfigureForm = template.configure?.Form || template.ConfigureForm;
  const supportsInherits = supportsTemplateInherits(template);
  const collectionCategoryFormItem = (
    <Form.Item name="category" label={t('Categories')}>
      <Select
        mode="multiple"
        options={categories.map((category) => ({
          value: String(category.id),
          label: compileLegacyTemplate(category.name || category.id, t),
        }))}
        allowClear
      />
    </Form.Item>
  );
  const collectionDescriptionFormItem = (
    <Form.Item name="description" label={t('Description')}>
      <Input.TextArea autoSize={{ minRows: 3, maxRows: 8 }} />
    </Form.Item>
  );
  const templateConfigureItems = (
    <>
      {TemplateConfigureForm ? <TemplateConfigureForm mode="create" template={template} form={form} /> : null}
      <CollectionTemplateConfigureItems mode="create" template={template} form={form} />
    </>
  );

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();
      const normalizedValues = buildCollectionCreateValues({
        template,
        formValues: values,
        selectedPresetFields,
        presetFields: collectionPresetFields,
        fieldInterfaceManager: ctx.dataSourceManager.collectionFieldInterfaceManager,
      });

      setSubmitting(true);
      try {
        await ctx.api.resource('collections').create({
          values: normalizedValues,
        });
        onSubmitted();
        ctx.dataSourceManager.getDataSource('main')?.reload();
      } finally {
        setSubmitting(false);
      }
    } catch (error) {
      if (!isFormValidationError(error)) {
        notification.error({
          message: getErrorMessage(error, t('Submit failed')),
        });
      }
      throw error;
    }
  }, [
    collectionPresetFields,
    ctx.api,
    ctx.dataSourceManager,
    form,
    notification,
    onSubmitted,
    selectedPresetFields,
    t,
    template,
  ]);

  return (
    <DrawerFormLayout
      title={t('Create collection')}
      submitting={submitting}
      submitText={t('Submit')}
      cancelText={t('Cancel')}
      onSubmit={handleSubmit}
    >
      <Form form={form} layout="vertical" initialValues={initialValues}>
        <CollectionTemplatePreview template={template} />
        <Form.Item name="template" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="title" label={t('Collection display name')} rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item
          name="name"
          label={t('Collection name')}
          rules={[
            { required: true },
            {
              pattern: /^[A-Za-z][A-Za-z0-9_]*$/,
              message: t('Support letters, numbers and underscores, must start with an letter.'),
            },
          ]}
          extra={t(
            'Randomly generated and can be modified. Support letters, numbers and underscores, must start with an letter.',
          )}
        >
          <Input />
        </Form.Item>
        {templateConfigureItems}
        {isSqlTemplate ? (
          <>
            {hasTemplateCapability(template, 'recordUniqueKey') ? (
              <CollectionCreateFilterTargetKey form={form} />
            ) : null}
            {collectionCategoryFormItem}
            {collectionDescriptionFormItem}
          </>
        ) : isViewTemplate ? (
          <>
            {hasTemplateCapability(template, 'recordUniqueKey') ? (
              <CollectionCreateFilterTargetKey form={form} />
            ) : null}
            {collectionCategoryFormItem}
            {collectionDescriptionFormItem}
            <Form.Item
              name="simplePaginate"
              valuePropName="checked"
              extra={t(
                'Skip getting the total number of table records during paging to speed up loading. It is recommended to enable this option for data tables with a large amount of data',
              )}
            >
              <Checkbox>{t('Use simple pagination mode')}</Checkbox>
            </Form.Item>
          </>
        ) : (
          <>
            {supportsInherits ? (
              <Form.Item name="inherits" label={t('Inherits')}>
                <Select mode="multiple" options={collectionOptions} loading={collectionRequest.loading} allowClear />
              </Form.Item>
            ) : null}
            {collectionCategoryFormItem}
            {collectionDescriptionFormItem}
            <Form.Item
              name="simplePaginate"
              valuePropName="checked"
              extra={t(
                'Skip getting the total number of table records during paging to speed up loading. It is recommended to enable this option for data tables with a large amount of data',
              )}
            >
              <Checkbox>{t('Use simple pagination mode')}</Checkbox>
            </Form.Item>
            {hasTemplateCapability(template, 'recordUniqueKey') ? (
              <CollectionCreateFilterTargetKey form={form} />
            ) : null}
            <Form.Item label={t('Preset fields')}>
              <Table
                size="small"
                rowKey="name"
                bordered
                pagination={false}
                dataSource={presetFieldRows}
                columns={presetColumns}
                rowSelection={{
                  type: 'checkbox',
                  selectedRowKeys: selectedPresetFields,
                  getCheckboxProps: (record) => ({
                    disabled: getTemplatePresetFieldsDisabled(template) || disabledPresetFields.has(record.name),
                  }),
                  onChange: (keys) => setSelectedPresetFields(keys),
                }}
              />
            </Form.Item>
          </>
        )}
      </Form>
    </DrawerFormLayout>
  );
}

function CollectionEditDrawer(props: {
  dataSourceKey: string;
  collection: Record<string, any>;
  categories: CollectionCategoryRecord[];
  onSubmitted: () => void;
}) {
  const { categories, collection, dataSourceKey, onSubmitted } = props;
  const t = useT();
  const ctx = useFlowContext();
  const { notification } = App.useApp();
  const plugin = ctx.app.pm.get(PluginDataSourceManagerClientV2);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const isMainDataSource = dataSourceKey === 'main';
  const template = useMemo(
    () => plugin.getCollectionTemplate(collection.template || 'general'),
    [collection.template, plugin],
  );
  const collectionRequest = useRequest(async () => {
    const response = await ctx.api.request({
      url: `dataSources/${dataSourceKey}/collections:list`,
      params: {
        paginate: false,
        sort: ['sort'],
        filter: JSON.stringify(getVisibleCollectionFilter()),
      },
    });
    return normalizeArrayResponse(response) as Array<Record<string, any>>;
  });
  const fieldsRequest = useRequest(async () => {
    const response = await ctx.api.request({
      url: getCollectionFieldActionUrl(dataSourceKey, collection.name, 'list'),
      params: {},
    });
    return normalizeArrayResponse(response) as Array<Record<string, any>>;
  });

  const collectionOptions = useMemo(
    () =>
      (collectionRequest.data || [])
        .filter(
          (item) => item.name && item.name !== collection.name && item.template !== 'view' && item.template !== 'file',
        )
        .map((item) => ({
          value: item.name,
          label: compileLegacyTemplate(item.title || item.name, t),
        })),
    [collection.name, collectionRequest.data, t],
  );
  const filterTargetKeyOptions = useMemo(() => {
    const fields =
      Array.isArray(collection.fields) && collection.fields.length ? collection.fields : fieldsRequest.data || [];
    const selectedFilterTargetKeys = getCollectionFilterTargetKey(collection) || [];
    const options = fields
      .filter((field) => {
        return !!field.name;
      })
      .map((field) => ({
        value: field.name,
        label: compileLegacyTemplate(field.uiSchema?.title || field.name, t),
      }));

    selectedFilterTargetKeys.forEach((key) => {
      if (!options.some((option) => option.value === key)) {
        options.push({ value: key, label: key });
      }
    });

    return options;
  }, [collection, fieldsRequest.data, t]);
  const initialValues = useMemo(
    () => ({
      title: collection.title,
      name: collection.name,
      inherits: Array.isArray(collection.inherits)
        ? collection.inherits
        : collection.inherits
          ? [collection.inherits]
          : undefined,
      category: Array.isArray(collection.category) ? collection.category.map((item) => String(item.id)) : [],
      description: collection.description,
      simplePaginate: collection.simplePaginate,
      filterTargetKey: getCollectionFilterTargetKey(collection),
      databaseView: getDatabaseViewFormValue(collection),
      schema: collection.schema,
      viewName: collection.viewName || collection.name,
      writableView: collection.writableView,
      sql: collection.sql,
      sources: collection.sources,
      fields: collection.fields,
    }),
    [collection],
  );

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();
      let submitValues = { ...values };
      if (collection.template === 'sql') {
        submitValues.name = collection.name;
        submitValues.key = collection.key;
      } else {
        delete submitValues.name;
      }
      if (!isMainDataSource) {
        delete submitValues.category;
        delete submitValues.inherits;
      }
      submitValues = template?.configure?.transformSubmitValues?.(submitValues) || submitValues;
      setSubmitting(true);
      try {
        if (isMainDataSource) {
          await ctx.api.resource(collection.template === 'sql' ? 'sqlCollection' : 'collections').update({
            filterByTk: collection.name,
            values: submitValues,
          });
        } else {
          await ctx.api.request({
            url: `dataSources/${dataSourceKey}/collections:update`,
            method: 'post',
            params: {
              filterByTk: collection.name,
            },
            data: submitValues,
          });
        }
        onSubmitted();
        ctx.dataSourceManager.getDataSource(dataSourceKey)?.reload();
      } finally {
        setSubmitting(false);
      }
    } catch (error) {
      if (!isFormValidationError(error)) {
        notification.error({
          message: getErrorMessage(error, t('Submit failed')),
        });
      }
      throw error;
    }
  }, [
    collection.key,
    collection.name,
    collection.template,
    ctx.api,
    ctx.dataSourceManager,
    dataSourceKey,
    form,
    isMainDataSource,
    notification,
    onSubmitted,
    t,
    template,
  ]);

  if (!isMainDataSource) {
    return (
      <DrawerFormLayout
        title={t('Edit collection')}
        submitting={submitting}
        submitText={t('Submit')}
        cancelText={t('Cancel')}
        onSubmit={handleSubmit}
      >
        <Form form={form} layout="vertical" initialValues={initialValues}>
          <Form.Item name="title" label={t('Collection display name')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="name"
            label={t('Collection name')}
            extra={t(
              'Randomly generated and can be modified. Support letters, numbers and underscores, must start with an letter.',
            )}
          >
            <Input disabled />
          </Form.Item>
          <Form.Item name="description" label={t('Description')}>
            <Input.TextArea autoSize={{ minRows: 3, maxRows: 8 }} />
          </Form.Item>
          <Form.Item
            name="simplePaginate"
            valuePropName="checked"
            extra={t(
              'Skip getting the total number of table records during paging to speed up loading. It is recommended to enable this option for data tables with a large amount of data',
            )}
          >
            <Checkbox>{t('Use simple pagination mode')}</Checkbox>
          </Form.Item>
          <Form.Item
            name="filterTargetKey"
            label={t('Record unique key')}
            extra={t(
              'If a collection lacks a primary key, you must configure a unique record key to locate row records within a block, failure to configure this will prevent the creation of data blocks for the collection.',
            )}
          >
            <Select mode="multiple" options={filterTargetKeyOptions} loading={fieldsRequest.loading} allowClear />
          </Form.Item>
        </Form>
      </DrawerFormLayout>
    );
  }

  const TemplateConfigureForm = template?.configure?.Form || template?.ConfigureForm;
  const supportsInherits = supportsTemplateInherits(template);
  const templateConfigureItems = template ? (
    <>
      {TemplateConfigureForm ? <TemplateConfigureForm mode="edit" template={template} form={form} /> : null}
      <CollectionTemplateConfigureItems mode="edit" template={template} form={form} />
    </>
  ) : null;

  return (
    <DrawerFormLayout
      title={t('Edit collection')}
      submitting={submitting}
      submitText={t('Submit')}
      cancelText={t('Cancel')}
      onSubmit={handleSubmit}
    >
      <Form form={form} layout="vertical" initialValues={initialValues}>
        <CollectionTemplatePreview template={template} />
        <Form.Item name="title" label={t('Collection display name')} rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item
          name="name"
          label={t('Collection name')}
          extra={t(
            'Randomly generated and can be modified. Support letters, numbers and underscores, must start with an letter.',
          )}
        >
          <Input disabled />
        </Form.Item>
        {templateConfigureItems}
        {isMainDataSource ? (
          <>
            {supportsInherits ? (
              <Form.Item name="inherits" label={t('Inherits')}>
                <Select mode="multiple" options={collectionOptions} loading={collectionRequest.loading} allowClear />
              </Form.Item>
            ) : null}
            <Form.Item name="category" label={t('Categories')}>
              <Select
                mode="multiple"
                options={categories.map((category) => ({
                  value: String(category.id),
                  label: compileLegacyTemplate(category.name || category.id, t),
                }))}
                allowClear
              />
            </Form.Item>
          </>
        ) : null}
        <Form.Item name="description" label={t('Description')}>
          <Input.TextArea autoSize={{ minRows: 3, maxRows: 8 }} />
        </Form.Item>
        <Form.Item
          name="simplePaginate"
          valuePropName="checked"
          extra={t(
            'Skip getting the total number of table records during paging to speed up loading. It is recommended to enable this option for data tables with a large amount of data',
          )}
        >
          <Checkbox>{t('Use simple pagination mode')}</Checkbox>
        </Form.Item>
        {hasTemplateCapability(template, 'recordUniqueKey') ? (
          <Form.Item
            name="filterTargetKey"
            label={t('Record unique key')}
            extra={t(
              'If a collection lacks a primary key, you must configure a unique record key to locate row records within a block, failure to configure this will prevent the creation of data blocks for the collection.',
            )}
          >
            <Select mode="multiple" options={filterTargetKeyOptions} loading={fieldsRequest.loading} allowClear />
          </Form.Item>
        ) : null}
      </Form>
    </DrawerFormLayout>
  );
}

function CollectionsPage(props: CollectionsPageProps) {
  const t = useT();
  const ctx = useFlowContext();
  const { message, modal, notification } = App.useApp();
  const plugin = ctx.app.pm.get(PluginDataSourceManagerClientV2);
  const [categoryForm] = Form.useForm();
  const filterValueRef = useRef<FilterGroupValue>(createEmptyFilter());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [activeCategoryKey, setActiveCategoryKey] = useState('all');
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categorySubmitting, setCategorySubmitting] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CollectionCategoryRecord>();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [filterPayload, setFilterPayload] = useState<CollectionFilterPayload>();
  const [loadTablesDrawerOpen, setLoadTablesDrawerOpen] = useState(false);
  const [loadTablesLoading, setLoadTablesLoading] = useState(false);
  const [availableTables, setAvailableTables] = useState<TableItem[]>([]);
  const [selectedTableKeys, setSelectedTableKeys] = useState<string[]>([]);
  const [selectedTransferKeys, setSelectedTransferKeys] = useState<string[]>([]);
  const [tableSearchValue, setTableSearchValue] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const isMainDataSource = props.dataSourceKey === 'main';
  const dataSource = ctx.dataSourceManager.getDataSource(props.dataSourceKey);
  const dataSourceType = plugin.getType(dataSource?.options?.type);
  const AddCollection = dataSourceType?.AddCollection;
  const EditCollection = dataSourceType?.EditCollection;
  const DeleteCollection = dataSourceType?.DeleteCollection;
  const configureFieldsDisabled = Boolean(dataSourceType?.disableConfigureFields);
  const allowDefaultCollectionEdit = !configureFieldsDisabled;
  const allowCustomCollectionEdit = Boolean(!isMainDataSource && !configureFieldsDisabled && EditCollection);
  const allowCustomCollectionCreate = Boolean(
    !isMainDataSource && !configureFieldsDisabled && dataSourceType?.allowCollectionCreate && AddCollection,
  );
  const allowCustomCollectionDeletion = Boolean(
    !isMainDataSource && !configureFieldsDisabled && dataSourceType?.allowCollectionDeletion && DeleteCollection,
  );
  const collectionTemplates = useMemo(() => plugin.getCollectionTemplates(), [plugin]);
  const categoryRequest = useRequest(
    async () => {
      if (!isMainDataSource) {
        return [] as CollectionCategoryRecord[];
      }
      const response = await ctx.api.request({
        url: 'collectionCategories:list',
        params: {
          paginate: false,
          sort: ['sort'],
        },
      });
      return normalizeArrayResponse(response) as CollectionCategoryRecord[];
    },
    {
      refreshDeps: [isMainDataSource],
    },
  );
  const request = useRequest(
    async () => {
      const filter = buildCollectionListFilter({
        activeCategoryKey,
        filterPayload,
        isMainDataSource,
      });
      const response = await ctx.api.request({
        url: isMainDataSource ? 'collections:list' : `dataSources/${props.dataSourceKey}/collections:list`,
        params: {
          page,
          pageSize,
          sort: ['sort'],
          filter: JSON.stringify(filter),
          appends: isMainDataSource ? ['fields', 'category'] : ['fields'],
        },
      });
      return normalizeListResponse(response);
    },
    {
      refreshDeps: [activeCategoryKey, filterPayload, isMainDataSource, props.dataSourceKey, page, pageSize],
    },
  );
  const categories = useMemo(() => categoryRequest.data || [], [categoryRequest.data]);

  useEffect(() => {
    if (!isMainDataSource) {
      setActiveCategoryKey('all');
      return;
    }

    if (activeCategoryKey !== 'all' && !categories.some((item) => String(item.id) === activeCategoryKey)) {
      setActiveCategoryKey('all');
    }
  }, [activeCategoryKey, categories, isMainDataSource]);

  const openFields = useCallback(
    (collection: Record<string, any>) => {
      ctx.viewer.drawer({
        title: (
          <span>
            {compileLegacyTemplate(collection.title || collection.name, t)} - {t('Configure fields')}
          </span>
        ),
        width: '80%',
        closable: true,
        content: () => (
          <FieldsPage
            dataSourceKey={props.dataSourceKey}
            collection={collection}
            onCollectionChange={(collectionName, values) => {
              Object.assign(collection, values);
              request.mutate(updateCollectionListRecord(request.data, collectionName, values));
              request.refresh();
            }}
          />
        ),
      });
    },
    [ctx.viewer, props.dataSourceKey, request, t],
  );

  const handleCategoryChange = useCallback((key: string) => {
    setActiveCategoryKey(key);
    setPage(1);
  }, []);

  const openCategoryModal = useCallback(() => {
    setEditingCategory(undefined);
    categoryForm.setFieldsValue({ color: 'default' });
    setCategoryModalOpen(true);
  }, [categoryForm]);

  const openEditCategoryModal = useCallback(
    (category: CollectionCategoryRecord) => {
      setEditingCategory(category);
      categoryForm.setFieldsValue({
        name: category.name,
        color: category.color || 'default',
      });
      setCategoryModalOpen(true);
    },
    [categoryForm],
  );

  const handleSubmitCategory = useCallback(async () => {
    try {
      const values = await categoryForm.validateFields();
      setCategorySubmitting(true);
      try {
        if (editingCategory) {
          await ctx.api.resource('collectionCategories').update({
            filter: { id: editingCategory.id },
            values,
          });
        } else {
          await ctx.api.resource('collectionCategories').create({
            values,
          });
        }
        setCategoryModalOpen(false);
        setEditingCategory(undefined);
        categoryForm.resetFields();
        categoryRequest.refresh();
        request.refresh();
      } finally {
        setCategorySubmitting(false);
      }
    } catch (error) {
      if (!isFormValidationError(error)) {
        notification.error({
          message: getErrorMessage(error, t('Submit failed')),
        });
      }
      throw error;
    }
  }, [categoryForm, categoryRequest, ctx.api, editingCategory, notification, request, t]);

  const handleDeleteCategory = useCallback(
    (category: CollectionCategoryRecord) => {
      modal.confirm({
        title: t('Delete category'),
        content: t('Are you sure you want to delete it?'),
        async onOk() {
          try {
            await ctx.api.resource('collectionCategories').destroy({
              filter: { id: category.id },
            });
            if (String(category.id) === activeCategoryKey) {
              setActiveCategoryKey('all');
            }
            categoryRequest.refresh();
            request.refresh();
          } catch (error) {
            notification.error({
              message: getErrorMessage(error, t('Delete failed')),
            });
            throw error;
          }
        },
      });
    },
    [activeCategoryKey, categoryRequest, ctx.api, modal, notification, request, t],
  );

  const handleSortCategory = useCallback(
    async (from: CollectionCategoryRecord, to: CollectionCategoryRecord) => {
      try {
        await ctx.api.resource('collectionCategories').move({
          sourceId: from.id,
          targetId: to.id,
        });
        categoryRequest.refresh();
        request.refresh();
      } catch (error) {
        notification.error({
          message: getErrorMessage(error, t('Save failed')),
        });
        throw error;
      }
    },
    [categoryRequest, ctx.api, notification, request, t],
  );

  const openCreateCollectionDrawer = useCallback(
    (template: CollectionTemplateOptions) => {
      ctx.viewer.drawer({
        width: '50%',
        closable: true,
        content: () => (
          <CollectionCreateDrawer
            template={template}
            categories={categories}
            activeCategoryKey={activeCategoryKey}
            onSubmitted={() => {
              setSelectedRowKeys([]);
              request.refresh();
            }}
          />
        ),
      });
    },
    [activeCategoryKey, categories, ctx.viewer, request],
  );

  const openEditCollectionDrawer = useCallback(
    (record: Record<string, any>) => {
      ctx.viewer.drawer({
        width: '50%',
        closable: true,
        content: () => (
          <CollectionEditDrawer
            dataSourceKey={props.dataSourceKey}
            collection={record}
            categories={categories}
            onSubmitted={() => {
              setSelectedRowKeys([]);
              request.refresh();
            }}
          />
        ),
      });
    },
    [categories, ctx.viewer, props.dataSourceKey, request],
  );

  const handleDeleteCollections = useCallback(
    (filterByTk: React.Key | React.Key[]) => {
      const keys = Array.isArray(filterByTk) ? filterByTk : [filterByTk];
      if (!keys.length) {
        return;
      }
      let cascade = false;
      modal.confirm({
        closable: true,
        icon: <ExclamationCircleFilled style={{ color: '#faad14' }} />,
        okText: t('Ok'),
        cancelText: t('Cancel'),
        title: t('Delete collection'),
        width: 520,
        content: (
          <div>
            <div>{t('Are you sure you want to delete it?')}</div>
            <Checkbox style={{ marginTop: 8 }} onChange={(event) => (cascade = event.target.checked)}>
              {t(
                'Automatically drop objects that depend on the collection (such as views), and in turn all objects that depend on those objects',
              )}
            </Checkbox>
          </div>
        ),
        async onOk() {
          try {
            await ctx.api.resource('collections').destroy({
              filterByTk: keys,
              cascade,
            });
            setSelectedRowKeys([]);
            request.refresh();
            ctx.dataSourceManager.getDataSource('main')?.reload();
          } catch (error) {
            notification.error({
              message: getErrorMessage(error, t('Delete failed')),
            });
            throw error;
          }
        },
      });
    },
    [ctx.api, ctx.dataSourceManager, modal, notification, request, t],
  );

  const handleSortCollection = useCallback(
    async (from: Record<string, any>, to: Record<string, any>) => {
      if (!isMainDataSource) {
        return;
      }
      try {
        await ctx.api.resource('collections').move({
          sourceId: from.name,
          targetId: to.name,
        });
        message.success(t('Saved successfully'));
        request.refresh();
        ctx.dataSourceManager.getDataSource('main')?.reload();
      } catch (error) {
        notification.error({
          message: getErrorMessage(error, t('Save failed')),
        });
        throw error;
      }
    },
    [ctx.api, ctx.dataSourceManager, isMainDataSource, message, notification, request, t],
  );

  const handleRefresh = useCallback(async () => {
    if (isMainDataSource) {
      request.refresh();
      return;
    }

    setRefreshing(true);
    try {
      const clientStatus = dataSource?.status || 'loaded';
      const response = await ctx.api.request({
        url: `dataSources:refresh?filterByTk=${encodeURIComponent(
          props.dataSourceKey,
        )}&clientStatus=${encodeURIComponent(clientStatus)}`,
        method: 'post',
      });
      const status = response?.data?.data?.status || response?.data?.status;
      if (status === 'reloading') {
        message.warning(t('Data source synchronization in progress'));
      } else if (status === 'loaded') {
        message.success(t('Data source synchronization successful'));
        request.refresh();
      }
      await ctx.dataSourceManager.getDataSource(props.dataSourceKey)?.reload();
    } catch (error) {
      notification.error({
        message: getErrorMessage(error, t('Data source synchronization failed')),
      });
    } finally {
      setRefreshing(false);
    }
  }, [
    ctx.api,
    ctx.dataSourceManager,
    dataSource?.status,
    isMainDataSource,
    message,
    notification,
    props.dataSourceKey,
    request,
    t,
  ]);

  const handleSyncFromDatabase = useCallback(() => {
    modal.confirm({
      title: t('Sync field changes from database'),
      content: t('Field synchronization confirmation prompt'),
      async onOk() {
        try {
          await ctx.api.resource('mainDataSource').syncFields();
          request.refresh();
          ctx.dataSourceManager.getDataSource('main')?.reload();
          message.success(t('Sync successfully'));
        } catch (error) {
          notification.error({
            message: getErrorMessage(error, t('Sync failed')),
          });
          throw error;
        }
      },
    });
  }, [ctx.api, ctx.dataSourceManager, message, modal, notification, request, t]);

  const resetLoadTablesDrawer = useCallback(() => {
    setLoadTablesDrawerOpen(false);
    setSelectedTableKeys([]);
    setSelectedTransferKeys([]);
    setTableSearchValue('');
  }, []);

  const openLoadTablesDrawer = useCallback(async () => {
    setLoadTablesDrawerOpen(true);
    setLoadTablesLoading(true);
    try {
      const response = await ctx.api.resource('dataSources').readTables({
        values: { dataSourceKey: 'main' },
      });
      const tables = response?.data?.data;
      setAvailableTables(
        (Array.isArray(tables) ? tables : []).map((item: Record<string, string>) => ({
          key: item.name,
          name: item.name,
          title: item.title || item.name,
          description: item.description,
        })),
      );
      setSelectedTableKeys([]);
      setSelectedTransferKeys([]);
    } catch (error) {
      notification.error({
        message: getErrorMessage(error, t('Failed to load tables')),
      });
    } finally {
      setLoadTablesLoading(false);
    }
  }, [ctx.api, notification, t]);

  const handleLoadTables = useCallback(() => {
    if (!selectedTableKeys.length) {
      message.warning(t('Please select at least one table'));
      return;
    }

    modal.confirm({
      title: t('Confirm load tables'),
      content: t('Are you sure you want to load {{count}} table(s)?').replace(
        '{{count}}',
        String(selectedTableKeys.length),
      ),
      async onOk() {
        setLoadTablesLoading(true);
        try {
          await ctx.api.resource('dataSources').loadTables({
            values: {
              dataSourceKey: 'main',
              tables: selectedTableKeys,
            },
          });
          message.success(t('Tables loaded successfully'));
          resetLoadTablesDrawer();
          request.refresh();
          ctx.dataSourceManager.getDataSource('main')?.reload();
        } catch (error) {
          notification.error({
            message: getErrorMessage(error, t('Failed to load tables')),
          });
          throw error;
        } finally {
          setLoadTablesLoading(false);
        }
      },
    });
  }, [
    ctx.api,
    ctx.dataSourceManager,
    message,
    modal,
    notification,
    request,
    resetLoadTablesDrawer,
    selectedTableKeys,
    t,
  ]);

  const handleSubmitFilter = useCallback(() => {
    setFilterPayload(transformFilter(filterValueRef.current as FilterGroupType) as CollectionFilterPayload);
    setPage(1);
  }, []);

  const handleResetFilter = useCallback(() => {
    filterValueRef.current.logic = '$and';
    filterValueRef.current.items.splice(0, filterValueRef.current.items.length);
    setFilterPayload(undefined);
    setPage(1);
  }, []);

  const filteredAvailableTables = useMemo(() => {
    if (!tableSearchValue) {
      return availableTables;
    }

    const lowerSearchValue = tableSearchValue.toLowerCase();
    return availableTables.filter((item) => {
      return (
        item.title.toLowerCase().includes(lowerSearchValue) ||
        item.name.toLowerCase().includes(lowerSearchValue) ||
        item.description?.toLowerCase().includes(lowerSearchValue)
      );
    });
  }, [availableTables, tableSearchValue]);

  const categoryTabItems = useMemo(
    () =>
      categories.map((item) => ({
        id: item.id,
        label: compileLegacyTemplate(item.name || item.id, t),
        color: item.color,
      })),
    [categories, t],
  );

  const findCategoryById = useCallback(
    (id: string | number) => categories.find((item) => String(item.id) === String(id)),
    [categories],
  );

  const columns = useMemo<ColumnsType<Record<string, any>>>(() => {
    const nextColumns: ColumnsType<Record<string, any>> = [
      {
        title: t('Collection display name'),
        render: (record) => compileLegacyTemplate(record.title || record.name, t),
      },
      { title: t('Collection name'), dataIndex: 'name', ellipsis: true },
      {
        title: t('Collection template'),
        dataIndex: 'template',
        render: (value) => <Tag>{getCollectionTemplateLabel(t, plugin, value)}</Tag>,
      },
    ];

    if (isMainDataSource && activeCategoryKey === 'all') {
      nextColumns.push({
        title: t('Collection category'),
        dataIndex: 'category',
        render: (value) => renderCategoryTags(value, t),
      });
    }

    nextColumns.push(
      { title: t('Description'), dataIndex: 'description', ellipsis: true },
      {
        title: t('Actions'),
        width:
          isMainDataSource || allowDefaultCollectionEdit || allowCustomCollectionEdit || allowCustomCollectionDeletion
            ? 260
            : 140,
        render: (_, record) => (
          <Space size={16}>
            <a onClick={() => openFields(record)}>{t('Configure fields')}</a>
            {isMainDataSource ? (
              <>
                <a onClick={() => openEditCollectionDrawer(record)}>{t('Edit')}</a>
                <a onClick={() => handleDeleteCollections(record.name)}>{t('Delete')}</a>
              </>
            ) : (
              <>
                {allowCustomCollectionEdit && EditCollection ? (
                  <EditCollection
                    dataSourceKey={props.dataSourceKey}
                    record={record}
                    onSubmitted={() => {
                      setSelectedRowKeys([]);
                      request.refresh();
                    }}
                  />
                ) : allowDefaultCollectionEdit ? (
                  <a onClick={() => openEditCollectionDrawer(record)}>{t('Edit')}</a>
                ) : null}
                {allowCustomCollectionDeletion && DeleteCollection ? (
                  <DeleteCollection
                    dataSourceKey={props.dataSourceKey}
                    record={record}
                    onSubmitted={() => {
                      setSelectedRowKeys([]);
                      request.refresh();
                    }}
                  />
                ) : null}
              </>
            )}
          </Space>
        ),
      },
    );

    return nextColumns;
  }, [
    EditCollection,
    DeleteCollection,
    activeCategoryKey,
    allowCustomCollectionEdit,
    allowDefaultCollectionEdit,
    allowCustomCollectionDeletion,
    handleDeleteCollections,
    isMainDataSource,
    openEditCollectionDrawer,
    openFields,
    plugin,
    props.dataSourceKey,
    request,
    t,
  ]);

  return (
    <Card title={compileLegacyTemplate(props.title, t)} variant="borderless">
      {isMainDataSource ? (
        <SortableCategoryTabs
          activeKey={activeCategoryKey}
          onChange={handleCategoryChange}
          allTab={{ key: 'all', label: t('All collections') }}
          categories={categoryTabItems}
          onAdd={openCategoryModal}
          onEdit={(id) => {
            const category = findCategoryById(id);
            if (category) {
              openEditCategoryModal(category);
            }
          }}
          onDelete={(id) => {
            const category = findCategoryById(id);
            if (category) {
              handleDeleteCategory(category);
            }
          }}
          onSort={(sourceId, targetId) => {
            const from = findCategoryById(sourceId);
            const to = findCategoryById(targetId);
            if (from && to) {
              return handleSortCategory(from, to);
            }
          }}
          menuLabels={{ edit: t('Edit category'), delete: t('Delete category') }}
        />
      ) : null}
      <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
        <CollectionFilterPopover
          value={filterValueRef.current}
          onSubmit={handleSubmitFilter}
          onReset={handleResetFilter}
        />
        <Space>
          <Button icon={<ReloadOutlined />} loading={refreshing} onClick={handleRefresh}>
            {t('Refresh')}
          </Button>
          {isMainDataSource ? (
            <>
              <Button
                icon={<DeleteOutlined />}
                disabled={!selectedRowKeys.length}
                onClick={() => handleDeleteCollections(selectedRowKeys)}
              >
                {t('Delete')}
              </Button>
              <Dropdown
                placement="bottomLeft"
                menu={{
                  items: [
                    {
                      key: 'load-tables',
                      icon: <ImportOutlined />,
                      label: t('Load tables from database'),
                    },
                    {
                      key: 'sync-fields',
                      icon: <ReloadOutlined />,
                      label: t('Sync field changes from database'),
                    },
                  ],
                  onClick: ({ key }) => {
                    if (key === 'load-tables') {
                      openLoadTablesDrawer();
                    }
                    if (key === 'sync-fields') {
                      handleSyncFromDatabase();
                    }
                  },
                }}
              >
                <Button icon={<SyncOutlined />}>
                  {t('Sync from database')} <DownOutlined />
                </Button>
              </Dropdown>
              <Dropdown
                menu={{
                  items: collectionTemplates.flatMap((template) => {
                    const item = {
                      key: template.name,
                      label: compileLegacyTemplate(template.title, t),
                    };
                    return template.divider ? [{ type: 'divider' as const }, item] : [item];
                  }),
                  onClick: ({ key }) => {
                    const template = collectionTemplates.find((item) => item.name === key);
                    if (template) {
                      openCreateCollectionDrawer(template);
                    }
                  },
                }}
              >
                <Button type="primary" icon={<PlusOutlined />}>
                  {t('Create collection')} <DownOutlined />
                </Button>
              </Dropdown>
            </>
          ) : (
            <>
              {allowCustomCollectionDeletion && DeleteCollection ? (
                <DeleteCollection
                  dataSourceKey={props.dataSourceKey}
                  selectedRowKeys={selectedRowKeys}
                  isBulk
                  onSubmitted={() => {
                    setSelectedRowKeys([]);
                    request.refresh();
                  }}
                >
                  {t('Delete')}
                </DeleteCollection>
              ) : null}
              {allowCustomCollectionCreate && AddCollection ? (
                <AddCollection
                  dataSourceKey={props.dataSourceKey}
                  onSubmitted={() => {
                    setSelectedRowKeys([]);
                    request.refresh();
                  }}
                />
              ) : null}
            </>
          )}
        </Space>
      </Flex>
      <Table<Record<string, any>>
        rowKey="name"
        isDraggable={isMainDataSource}
        onSortEnd={isMainDataSource ? handleSortCollection : undefined}
        loading={request.loading}
        dataSource={request.data?.records || []}
        columns={columns}
        rowSelection={
          isMainDataSource || allowCustomCollectionDeletion
            ? {
                selectedRowKeys,
                onChange: (keys) => setSelectedRowKeys(keys),
              }
            : undefined
        }
        pagination={{
          current: page,
          pageSize,
          total: request.data?.total,
          onChange(nextPage, nextPageSize) {
            if (nextPageSize !== pageSize) {
              setPageSize(nextPageSize);
              setPage(1);
              return;
            }
            setPage(nextPage);
          },
        }}
      />
      <Modal
        title={editingCategory ? t('Edit category') : t('Add category')}
        open={categoryModalOpen}
        confirmLoading={categorySubmitting}
        okText={t('Submit')}
        cancelText={t('Cancel')}
        onOk={handleSubmitCategory}
        onCancel={() => {
          setCategoryModalOpen(false);
          setEditingCategory(undefined);
          categoryForm.resetFields();
        }}
      >
        <Form form={categoryForm} layout="vertical" initialValues={{ color: 'default' }}>
          <Form.Item name="name" label={t('Category name')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="color" label={t('Color')}>
            <Select
              options={colorOptions.map((color) => ({
                value: color,
                label: <Tag color={color === 'default' ? undefined : color}>{t(colorLabels[color])}</Tag>,
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>
      <Drawer
        title={t('Load tables from database')}
        placement="right"
        width={800}
        open={loadTablesDrawerOpen}
        onClose={resetLoadTablesDrawer}
        footer={
          <Flex justify="flex-end" gap={8}>
            <Button onClick={resetLoadTablesDrawer}>{t('Cancel')}</Button>
            <Button
              type="primary"
              loading={loadTablesLoading}
              disabled={!selectedTableKeys.length}
              onClick={handleLoadTables}
            >
              {t('Submit')}
            </Button>
          </Flex>
        }
      >
        <Spin spinning={loadTablesLoading}>
          <Transfer
            dataSource={filteredAvailableTables}
            titles={[t('Available tables'), t('Selected tables')]}
            targetKeys={selectedTableKeys}
            selectedKeys={selectedTransferKeys}
            onChange={(nextTargetKeys) => setSelectedTableKeys(nextTargetKeys.map(String))}
            onSelectChange={(sourceSelectedKeys, targetSelectedKeys) =>
              setSelectedTransferKeys([...sourceSelectedKeys, ...targetSelectedKeys].map(String))
            }
            onSearch={(_, value) => setTableSearchValue(value)}
            render={(item) => item.title}
            showSearch
            style={{ height: 'calc(100vh - 160px)' }}
            listStyle={{
              width: 350,
              height: 'calc(100vh - 220px)',
            }}
            locale={{
              itemUnit: t('item'),
              itemsUnit: t('items'),
              searchPlaceholder: t('Search collections...'),
            }}
          />
        </Spin>
      </Drawer>
    </Card>
  );
}

export default CollectionsPage;
