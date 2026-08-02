/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DeleteOutlined, DownOutlined, PlusOutlined, SyncOutlined } from '@ant-design/icons';
import { DrawerFormLayout, isTitleField, Table, useCurrentAppInfo } from '@nocobase/client-v2';
import { useFlowContext } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import {
  Alert,
  App,
  Button,
  Cascader,
  Descriptions,
  Dropdown,
  Form,
  Input,
  Select,
  Space,
  Spin,
  Switch,
  Table as AntdTable,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import type { MenuProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useT } from '../../locale';
import { PluginDataSourceManagerClientV2 } from '../../plugin';
import type { DataSourceTypeOptions } from '../../plugin';
import { compileLegacyTemplate } from '../../utils/compileLegacyTemplate';
import { getErrorMessage, isFormValidationError } from '../../utils/error';
import { getCollectionFieldActionUrl } from './collectionFieldApi';
import {
  filterCreateFieldInterfacesByCollectionTemplate,
  filterFieldInterfacesByCollectionTemplate,
} from './collectionTemplateFieldInterfaces';
import { FieldForm } from './FieldForm';

interface FieldsPageProps {
  dataSourceKey: string;
  collection: Record<string, any>;
  onCollectionChange?: (collectionName: string, values: Record<string, any>) => void;
}

type FieldInterfaceOption = {
  name: string;
  title?: React.ReactNode;
  label?: React.ReactNode;
  creatable?: boolean;
  group?: string;
  order?: number;
  hidden?: boolean;
  isAssociation?: boolean;
  availableTypes?: string[];
  default?: Record<string, any>;
};

type FieldInterfaceGroupOption = {
  key: string;
  label: React.ReactNode;
  order?: number;
  children: FieldInterfaceOption[];
};

type ViewFieldRecord = {
  interface?: string;
  name: string;
  possibleTypes?: string[];
  source?: string | string[] | null;
  type?: string;
  uiSchema?: Record<string, any>;
  [key: string]: any;
};

type InheritedFieldGroup = {
  collectionName: string;
  fields: Record<string, any>[];
  key: string;
  title?: React.ReactNode;
};

type ViewFieldsResponse = {
  fields?: ViewFieldRecord[] | Record<string, ViewFieldRecord>;
  sources?: string[];
  unsupportedFields?: ViewFieldRecord[];
};

type SourceFieldOption = {
  children: Array<{ label: React.ReactNode; value: string }>;
  label: React.ReactNode;
  value: string;
};

function normalizeListResponse(response: any) {
  const payload = response?.data?.data;
  return Array.isArray(payload) ? payload : [];
}

const fallbackFieldInterfaceGroups: Record<string, { label: string; order: number }> = {
  basic: { label: 'Basic', order: 1 },
  choices: { label: 'Choices', order: 20 },
  media: { label: 'Media', order: 40 },
  datetime: { label: 'Date & Time', order: 80 },
  relation: { label: 'Relation', order: 100 },
  advanced: { label: 'Advanced type', order: 200 },
  systemInfo: { label: 'System info', order: 400 },
  others: { label: 'Others', order: 800 },
};

function getFieldInterfaces(ctx: any, dataSourceType?: string) {
  const manager = ctx.dataSourceManager.collectionFieldInterfaceManager;
  return (manager?.getFieldInterfaces?.(dataSourceType) || []) as FieldInterfaceOption[];
}

function getAppInfoDatabaseDialect(appInfo?: Record<string, any>) {
  return appInfo?.database?.dialect || appInfo?.data?.database?.dialect;
}

function getFieldInterfaceOptions(ctx: any, dataSourceType?: string) {
  const manager = ctx.dataSourceManager.collectionFieldInterfaceManager;
  const fieldInterfaces = getFieldInterfaces(ctx, dataSourceType);
  const fieldGroups = {
    ...fallbackFieldInterfaceGroups,
    ...(manager?.getFieldInterfaceGroups?.() || {}),
  };
  const grouped = fieldInterfaces.reduce<Record<string, FieldInterfaceOption[]>>((memo, fieldInterface) => {
    if (fieldInterface.hidden) {
      return memo;
    }
    const group = fieldInterface.group || 'basic';
    memo[group] = memo[group] || [];
    memo[group].push(fieldInterface);
    return memo;
  }, {});

  return Object.keys(fieldGroups)
    .map((groupName) => {
      const group = fieldGroups[groupName];
      return {
        ...group,
        key: groupName,
        children: (grouped[groupName] || []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
      };
    })
    .filter((group) => group.children.length)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) as FieldInterfaceGroupOption[];
}

function filterFieldInterfacesByTemplate(
  fieldInterfaces: FieldInterfaceOption[],
  collection: Record<string, any>,
  ctx: any,
  databaseDialect?: string,
) {
  const plugin = ctx.app.pm.get(PluginDataSourceManagerClientV2);
  const template = plugin?.getCollectionTemplate?.(collection.template || 'general');
  return filterFieldInterfacesByCollectionTemplate(fieldInterfaces, template, collection, { databaseDialect });
}

function filterFieldInterfaceGroupsByTemplate(
  groups: FieldInterfaceGroupOption[],
  collection: Record<string, any>,
  ctx: any,
  databaseDialect?: string,
) {
  return groups
    .map((group) => ({
      ...group,
      children: filterFieldInterfacesByTemplate(group.children, collection, ctx, databaseDialect),
    }))
    .filter((group) => group.children.length);
}

function filterCreateFieldInterfaces(groups: FieldInterfaceGroupOption[], collection: Record<string, any>, ctx: any) {
  const plugin = ctx.app.pm.get(PluginDataSourceManagerClientV2);
  const template = plugin?.getCollectionTemplate?.(collection.template || 'general');
  return groups
    .map((group) => ({
      ...group,
      children: filterCreateFieldInterfacesByCollectionTemplate(group.children, template),
    }))
    .filter((group) => group.children.length);
}

function filterCreateFieldInterfacesByDataSource(
  groups: FieldInterfaceGroupOption[],
  dataSourceType: DataSourceTypeOptions | undefined,
  collection: Record<string, any>,
) {
  const filter =
    typeof dataSourceType?.createFieldInterfaces === 'function'
      ? dataSourceType.createFieldInterfaces({ collection })
      : dataSourceType?.createFieldInterfaces;
  if (!filter) {
    return groups;
  }
  const includedGroups = filter.groups?.length ? new Set(filter.groups) : null;
  const includedInterfaces = filter.include?.length ? new Set(filter.include) : null;
  const excludedInterfaces = filter.exclude?.length ? new Set(filter.exclude) : null;

  return groups
    .map((group) => ({
      ...group,
      children:
        includedGroups && !includedGroups.has(group.key)
          ? []
          : group.children.filter((fieldInterface) => {
              if (includedInterfaces && !includedInterfaces.has(fieldInterface.name)) {
                return false;
              }
              if (excludedInterfaces?.has(fieldInterface.name)) {
                return false;
              }
              return true;
            }),
    }))
    .filter((group) => group.children.length);
}

function isFieldInterfaceCompatible(fieldInterface: FieldInterfaceOption, field: Record<string, any>) {
  if (fieldInterface.name === field.interface) {
    return true;
  }
  return fieldInterface.availableTypes?.includes(field.type) || fieldInterface.default?.type === field.type;
}

function getSelectableFieldInterfaceGroups(groups: FieldInterfaceGroupOption[], field: Record<string, any>) {
  return groups
    .map((group) => ({
      ...group,
      children: group.children.filter((fieldInterface) => isFieldInterfaceCompatible(fieldInterface, field)),
    }))
    .filter((group) => {
      if (field.type === 'sort') {
        return group.key === 'advanced' && group.children.length;
      }
      return group.children.length;
    });
}

function getFieldInterfaceLabel(fieldInterface?: FieldInterfaceOption, fallback?: React.ReactNode) {
  return fieldInterface?.title || fieldInterface?.label || fallback || fieldInterface?.name;
}

function getCollectionPresetFieldInterfaces(ctx: any) {
  const plugin = ctx.app.pm.get(PluginDataSourceManagerClientV2);
  const presetFields = plugin?.getCollectionPresetFields?.() || [];
  const fieldInterfaces = new Set<string>();
  presetFields.forEach((presetField) => {
    const fieldInterface = presetField.value?.interface || presetField.value?.name;
    if (fieldInterface) {
      fieldInterfaces.add(fieldInterface);
    }
  });
  return fieldInterfaces;
}

function getEditableFieldDisplayName(record: Record<string, any>) {
  const title = record.uiSchema?.title;
  return typeof title === 'string' ? title : title == null ? record.name : String(title);
}

function EditableFieldDisplayNameCell(props: {
  loading?: boolean;
  onSave: (record: Record<string, any>, value: string) => Promise<void>;
  record: Record<string, any>;
}) {
  const [value, setValue] = useState(getEditableFieldDisplayName(props.record));

  useEffect(() => {
    setValue(getEditableFieldDisplayName(props.record));
  }, [props.record]);

  const handleSave = useCallback(() => {
    const currentValue = getEditableFieldDisplayName(props.record);
    const nextValue = value.trim();
    if (!nextValue || nextValue === currentValue) {
      setValue(currentValue);
      return;
    }
    props.onSave(props.record, nextValue).catch(() => {
      setValue(currentValue);
    });
  }, [props, value]);

  return (
    <Input
      disabled={props.loading}
      value={value}
      onBlur={handleSave}
      onChange={(event) => setValue(event.target.value)}
      onPressEnter={(event) => event.currentTarget.blur()}
      suffix={props.loading ? <Spin size="small" /> : null}
    />
  );
}

function InheritedFieldDetails(props: { field: Record<string, any>; fieldInterface?: FieldInterfaceOption }) {
  const t = useT();
  const field = props.field;
  const fieldInterfaceTitle = getFieldInterfaceLabel(props.fieldInterface, field.interface);

  return (
    <Descriptions column={1} bordered size="small">
      <Descriptions.Item label={t('Field display name')}>
        {compileLegacyTemplate(getEditableFieldDisplayName(field), t)}
      </Descriptions.Item>
      <Descriptions.Item label={t('Field name')}>{field.name}</Descriptions.Item>
      <Descriptions.Item label={t('Field type')}>
        <Tag>{field.type}</Tag>
      </Descriptions.Item>
      <Descriptions.Item label={t('Field interface')}>
        <Tag>{compileLegacyTemplate(fieldInterfaceTitle, t)}</Tag>
      </Descriptions.Item>
      {field.description ? (
        <Descriptions.Item label={t('Description')}>{compileLegacyTemplate(field.description, t)}</Descriptions.Item>
      ) : null}
    </Descriptions>
  );
}

function isReadOnlyFieldInterface(
  record: Record<string, any>,
  options: {
    collection: Record<string, any>;
    currentFieldInterface?: FieldInterfaceOption;
    dataSourceType?: DataSourceTypeOptions;
    presetFieldInterfaces: Set<string>;
  },
) {
  const dataSourceReadOnly = options.dataSourceType?.isFieldInterfaceReadOnly?.({
    collection: options.collection,
    field: record,
    fieldInterface: options.currentFieldInterface,
  });
  if (typeof dataSourceReadOnly === 'boolean') {
    return dataSourceReadOnly;
  }
  return Boolean(
    record.source ||
      options.currentFieldInterface?.isAssociation ||
      options.currentFieldInterface?.group === 'systemInfo' ||
      options.presetFieldInterfaces.has(record.interface),
  );
}

function getCollectionUpdateActionUrl(dataSourceKey: string) {
  return dataSourceKey === 'main' ? 'collections:update' : `dataSources/${dataSourceKey}/collections:update`;
}

function getCollectionTitleField(ctx: any, dataSourceKey: string, collection: Record<string, any>) {
  return (
    collection.titleField ||
    ctx.dataSourceManager
      .getDataSource(dataSourceKey)
      ?.collectionManager?.getCollection(collection.name)
      ?.getOption?.('titleField')
  );
}

function setCollectionTitleField(ctx: any, dataSourceKey: string, collection: Record<string, any>, titleField: string) {
  ctx.dataSourceManager
    .getDataSource(dataSourceKey)
    ?.collectionManager?.getCollection(collection.name)
    ?.setOption?.('titleField', titleField);
  collection.titleField = titleField;
}

function isViewCollection(collection: Record<string, any>) {
  return collection.template === 'view' || collection.view;
}

function getCollectionTemplate(ctx: any, collection: Record<string, any>) {
  const plugin = ctx.app.pm.get(PluginDataSourceManagerClientV2);
  return plugin?.getCollectionTemplate?.(collection.template || 'general');
}

function isTemplateSyncFieldsVisible(options: { collection: Record<string, any>; ctx: any; dataSourceKey: string }) {
  const template = getCollectionTemplate(options.ctx, options.collection);
  const syncFields = template?.configure?.syncFields;
  if (!syncFields) {
    return false;
  }
  if (typeof syncFields.visible === 'function') {
    return syncFields.visible({
      collection: options.collection,
      dataSourceKey: options.dataSourceKey,
    });
  }
  return syncFields.visible !== false;
}

function isSyncFieldsVisible(dataSourceKey: string, collection: Record<string, any>, ctx: any) {
  const plugin = ctx.app.pm.get(PluginDataSourceManagerClientV2);
  const dataSource = ctx.dataSourceManager.getDataSource(dataSourceKey);
  const dataSourceType = plugin?.getType?.(dataSource?.options?.type);

  if (dataSourceType?.disableConfigureFields) {
    return false;
  }

  if (isViewCollection(collection)) {
    return dataSourceKey === 'main';
  }

  if (isTemplateSyncFieldsVisible({ collection, ctx, dataSourceKey })) {
    return true;
  }

  if (collection.from === 'db2cm') {
    return false;
  }

  return dataSourceKey === 'main';
}

function getCollectionTemplateFields(collectionTemplate?: Record<string, any>) {
  const fields = collectionTemplate?.collection?.fields;
  return typeof fields === 'function' ? fields() : Array.isArray(fields) ? fields : [];
}

export function isFieldDeleteDisabled(record: Record<string, any>, collectionTemplate?: Record<string, any>) {
  if (record.deletable === false) {
    return true;
  }
  return getCollectionTemplateFields(collectionTemplate).some(
    (field: Record<string, any>) => field?.name === record.name && field.deletable === false,
  );
}

function normalizeRuntimeField(field: any, collectionName?: string) {
  const options = field?.options || field || {};
  return {
    ...options,
    collectionName: options.collectionName || field?.collectionName || field?.collection?.name || collectionName,
  };
}

function getRuntimeCollectionOwnFields(collection: any) {
  if (!collection) {
    return [];
  }
  if (collection.fields instanceof Map) {
    return Array.from(collection.fields.values()).map((field) => normalizeRuntimeField(field, collection.name));
  }
  return Array.isArray(collection.fields)
    ? collection.fields.map((field) => normalizeRuntimeField(field, collection.name))
    : [];
}

export function getInheritedFieldGroups(collection: any) {
  const groups: InheritedFieldGroup[] = [];
  const visitedCollections = new Set<string>();

  const visitParentCollections = (currentCollection: any) => {
    const parentCollections =
      currentCollection?.inherits instanceof Map ? Array.from(currentCollection.inherits.values()) : [];
    parentCollections.forEach((parentCollection: any) => {
      if (!parentCollection?.name || visitedCollections.has(parentCollection.name)) {
        return;
      }
      visitedCollections.add(parentCollection.name);
      groups.push({
        collectionName: parentCollection.name,
        fields: getRuntimeCollectionOwnFields(parentCollection),
        key: parentCollection.name,
        title: parentCollection.title || parentCollection.options?.title || parentCollection.name,
      });
      visitParentCollections(parentCollection);
    });
  };

  visitParentCollections(collection);
  return groups;
}

export function isInheritedFieldOverridden(
  record: Record<string, any>,
  currentCollectionName: string,
  currentFieldsByName: Map<string, Record<string, any>>,
) {
  const currentField = currentFieldsByName.get(record.name);
  return Boolean(
    currentField && (!currentField.collectionName || currentField.collectionName === currentCollectionName),
  );
}

function getOverrideInitialField(record: Record<string, any>) {
  const { collectionName, key, sort, uiSchemaUid, ...rest } = record;
  return rest;
}

function isAddFieldVisible(options: {
  collection: Record<string, any>;
  dataSourceType?: string;
  fieldInterfaceGroups: FieldInterfaceGroupOption[];
  ctx: any;
}) {
  const plugin = options.ctx.app.pm.get(PluginDataSourceManagerClientV2);
  const dataSourceType = plugin?.getType?.(options.dataSourceType);
  return (
    !dataSourceType?.disableConfigureFields &&
    !dataSourceType?.disableAddFields &&
    options.collection.template !== 'sql' &&
    options.fieldInterfaceGroups.length > 0
  );
}

function getViewName(collection: Record<string, any>) {
  return collection.viewName || collection.name;
}

function normalizeViewFieldsPayload(value: unknown): ViewFieldsResponse {
  const payload = (value as any)?.data?.data || (value as any)?.data || value || {};
  return {
    fields: (payload as ViewFieldsResponse).fields,
    sources: (payload as ViewFieldsResponse).sources,
    unsupportedFields: (payload as ViewFieldsResponse).unsupportedFields,
  };
}

function normalizeViewFields(fields?: ViewFieldsResponse['fields']) {
  if (!fields) {
    return [];
  }
  return (Array.isArray(fields) ? fields : Object.values(fields)).filter(Boolean);
}

function omitRawTitle(uiSchema?: Record<string, any>) {
  const { rawTitle, ...rest } = uiSchema || {};
  return rest;
}

function toSourcePath(source?: string | string[] | null) {
  if (Array.isArray(source)) {
    return source.filter(Boolean) as string[];
  }
  return typeof source === 'string' ? source.split('.').filter(Boolean) : [];
}

function normalizeSource(source?: string | string[] | null) {
  const sourcePath = toSourcePath(source);
  return sourcePath.length ? sourcePath.join('.') : null;
}

function getFieldOptions(field: any) {
  return field?.options || field || {};
}

function getFieldTitle(field: any) {
  const options = getFieldOptions(field);
  return options.uiSchema?.title || options.title || options.name;
}

function getViewFieldInterfaceOptions(groups: FieldInterfaceGroupOption[], fieldType?: string) {
  return groups
    .filter((group) => !['relation', 'systemInfo'].includes(group.key))
    .map((group) => ({
      label: group.label,
      options: group.children
        .filter((fieldInterface) => {
          if (!fieldType) {
            return true;
          }
          return fieldInterface.availableTypes?.includes(fieldType) || fieldInterface.default?.type === fieldType;
        })
        .map((fieldInterface) => ({
          label: fieldInterface.title || fieldInterface.label || fieldInterface.name,
          value: fieldInterface.name,
        })),
    }))
    .filter((group) => group.options.length);
}

function mergeViewFields(options: {
  currentFields?: ViewFieldRecord[];
  fieldInterfacesByName: Record<string, FieldInterfaceOption>;
  inferredFields: ViewFieldRecord[];
}) {
  const currentFieldsByName = new Map((options.currentFields || []).map((field) => [field.name, field]));

  return options.inferredFields.map((field) => {
    const currentField = currentFieldsByName.get(field.name) || field;
    const fieldInterface = options.fieldInterfacesByName[currentField.interface || field.interface || ''];
    const fallbackUiSchema = fieldInterface?.default?.uiSchema || {};
    const title = currentField.uiSchema?.title || currentField.title || field.uiSchema?.title || field.name;
    const uiSchema = {
      ...omitRawTitle(fallbackUiSchema),
      ...omitRawTitle(currentField.uiSchema || field.uiSchema),
      title,
    };

    if (field.source) {
      return {
        ...field,
        interface: field.interface || currentField.interface,
        type: field.type || currentField.type,
        uiSchema,
      };
    }

    return {
      ...field,
      ...currentField,
      uiSchema,
    };
  });
}

function ViewSyncFieldsDrawer(props: {
  collection: Record<string, any>;
  currentFields?: ViewFieldRecord[];
  fieldInterfaceGroups: FieldInterfaceGroupOption[];
  fieldInterfacesByName: Record<string, FieldInterfaceOption>;
  onSubmitted: () => void;
}) {
  const t = useT();
  const ctx = useFlowContext();
  const { message, notification } = App.useApp();
  const [form] = Form.useForm();
  const [fields, setFields] = useState<ViewFieldRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<Array<Record<string, unknown>>>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [unsupportedFields, setUnsupportedFields] = useState<ViewFieldRecord[]>([]);
  const [sourceCollections, setSourceCollections] = useState<string[]>([]);
  const mainDataSource = ctx.dataSourceManager.getDataSource('main');
  const viewName = getViewName(props.collection);

  const sourceFieldOptions = useMemo(() => {
    const options: SourceFieldOption[] = [];
    sourceCollections.forEach((collectionName) => {
      const collection = mainDataSource?.getCollection(collectionName);
      if (!collection) {
        return;
      }
      const children = collection
        .getFields()
        .filter((field) => !['hasOne', 'hasMany', 'belongsToMany'].includes(field.type))
        .map((field) => ({
          value: field.name,
          label: compileLegacyTemplate(getFieldTitle(field), t),
        }));
      options.push({
        value: collectionName,
        label: compileLegacyTemplate(collection.title || collection.name, t),
        children,
      });
    });
    return options;
  }, [mainDataSource, sourceCollections, t]);

  const previewColumns = useMemo(() => {
    return fields
      .filter((field) => field.source || field.interface)
      .map((field) => ({
        title: compileLegacyTemplate(field.uiSchema?.title || field.name, t),
        dataIndex: field.name,
        key: field.name,
        width: 200,
        ellipsis: true,
        render: (value: unknown) => {
          if (value == null) {
            return null;
          }
          if (typeof value === 'object') {
            return JSON.stringify(value);
          }
          return String(value);
        },
      }));
  }, [fields, t]);

  const loadPreviewData = useCallback(
    async (nextFields: ViewFieldRecord[]) => {
      setPreviewLoading(true);
      try {
        const mapFieldTypes = ['lineString', 'point', 'circle', 'polygon'];
        const fieldTypes = nextFields.reduce<Record<string, string>>((memo, field) => {
          if (field.type && mapFieldTypes.includes(field.type)) {
            memo[field.name] = field.type;
          }
          return memo;
        }, {});
        const response = await ctx.api.resource('dbViews').query({
          filterByTk: viewName,
          schema: props.collection.schema,
          fieldTypes,
        });
        setPreviewData(((response as any)?.data?.data || []) as Array<Record<string, unknown>>);
      } finally {
        setPreviewLoading(false);
      }
    },
    [ctx.api, props.collection.schema, viewName],
  );

  useEffect(() => {
    let ignore = false;

    const loadFields = async () => {
      setLoading(true);
      try {
        const response = await ctx.api.resource('dbViews').get({
          filterByTk: viewName,
          schema: props.collection.schema,
        });
        if (ignore) {
          return;
        }
        const payload = normalizeViewFieldsPayload(response);
        const nextFields = mergeViewFields({
          currentFields: props.currentFields,
          fieldInterfacesByName: props.fieldInterfacesByName,
          inferredFields: normalizeViewFields(payload.fields),
        });
        const nextSources = Array.isArray(payload.sources) ? payload.sources : [];
        setFields(nextFields);
        setUnsupportedFields(Array.isArray(payload.unsupportedFields) ? payload.unsupportedFields : []);
        setSourceCollections(nextSources);
        form.setFieldsValue({
          fields: nextFields.map((field) => ({
            ...field,
            source: normalizeSource(field.source),
          })),
          schema: props.collection.schema,
          sources: nextSources,
          viewName,
        });
        await loadPreviewData(nextFields);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadFields();

    return () => {
      ignore = true;
    };
  }, [
    ctx.api,
    form,
    loadPreviewData,
    props.collection.schema,
    props.currentFields,
    props.fieldInterfacesByName,
    viewName,
  ]);

  const handleFieldChange = useCallback(
    (index: number, nextField: ViewFieldRecord) => {
      const nextFields = [...fields];
      nextFields[index] = nextField;
      setFields(nextFields);
      form.setFieldValue(
        'fields',
        nextFields.map((field) => ({
          ...field,
          source: normalizeSource(field.source),
        })),
      );
    },
    [fields, form],
  );

  const fieldColumns = useMemo<ColumnsType<ViewFieldRecord>>(
    () => [
      {
        title: t('Field name'),
        dataIndex: 'name',
        width: 130,
      },
      {
        title: t('Field source'),
        dataIndex: 'source',
        width: 220,
        render: (_, record, index) => (
          <Cascader
            allowClear
            options={sourceFieldOptions}
            value={toSourcePath(record.source)}
            style={{ width: '100%' }}
            placeholder={t('Select field source')}
            onChange={(value) => {
              const sourcePath = (value || []).map(String);
              const sourceField = sourcePath.length
                ? mainDataSource?.getCollectionField(sourcePath.join('.'))?.options
                : undefined;
              handleFieldChange(index, {
                ...record,
                interface: sourceField?.interface || record.interface,
                source: sourcePath,
                type: sourceField?.type || record.type,
                uiSchema: {
                  ...record.uiSchema,
                  ...sourceField?.uiSchema,
                  title: sourceField?.uiSchema?.title || record.uiSchema?.title || record.name,
                },
              });
            }}
          />
        ),
      },
      {
        title: t('Field type'),
        dataIndex: 'type',
        width: 140,
        render: (value, record, index) =>
          record.source || !record.possibleTypes?.length ? (
            <Tag>{value}</Tag>
          ) : (
            <Select
              value={value}
              style={{ width: '100%' }}
              popupMatchSelectWidth={false}
              options={record.possibleTypes.map((type) => ({ label: type, value: type }))}
              onChange={(nextType) => handleFieldChange(index, { ...record, type: nextType })}
            />
          ),
      },
      {
        title: t('Field interface'),
        dataIndex: 'interface',
        width: 170,
        render: (value, record, index) => {
          if (record.source) {
            return (
              <Tag>{compileLegacyTemplate(getFieldInterfaceLabel(props.fieldInterfacesByName[value], value), t)}</Tag>
            );
          }
          return (
            <Select
              allowClear
              value={value || undefined}
              style={{ width: '100%' }}
              popupMatchSelectWidth={false}
              options={getViewFieldInterfaceOptions(props.fieldInterfaceGroups, record.type).map((group) => ({
                label: compileLegacyTemplate(group.label, t),
                options: group.options.map((option) => ({
                  value: option.value,
                  label: compileLegacyTemplate(option.label, t),
                })),
              }))}
              onChange={(nextInterfaceName) => {
                const fieldInterface = props.fieldInterfacesByName[nextInterfaceName];
                handleFieldChange(index, {
                  ...record,
                  interface: nextInterfaceName || null,
                  type: fieldInterface?.default?.type || record.type,
                  uiSchema: {
                    ...fieldInterface?.default?.uiSchema,
                    title: fieldInterface?.default?.uiSchema?.title || record.uiSchema?.title || record.name,
                  },
                });
              }}
            />
          );
        },
      },
      {
        title: t('Field display name'),
        dataIndex: ['uiSchema', 'title'],
        width: 200,
        render: (_, record, index) => (
          <Input
            value={record.uiSchema?.title || record.name}
            onChange={(event) =>
              handleFieldChange(index, {
                ...record,
                uiSchema: {
                  ...omitRawTitle(record.uiSchema),
                  title: event.target.value,
                },
              })
            }
          />
        ),
      },
    ],
    [handleFieldChange, mainDataSource, props.fieldInterfaceGroups, props.fieldInterfacesByName, sourceFieldOptions, t],
  );

  const handleSubmit = useCallback(async () => {
    try {
      await form.validateFields();
      const values = form.getFieldsValue(true);
      setSubmitting(true);
      try {
        await ctx.api.resource('collections').setFields({
          filterByTk: props.collection.name,
          values: {
            fields: values.fields,
            schema: values.schema,
            sources: values.sources,
            viewName: values.viewName,
          },
        });
        await ctx.dataSourceManager.getDataSource('main')?.reload();
        props.onSubmitted();
        message.success(t('Sync successfully'));
      } finally {
        setSubmitting(false);
      }
    } catch (error) {
      if (!isFormValidationError(error)) {
        notification.error({
          message: getErrorMessage(error, t('Sync failed')),
        });
      }
      throw error;
    }
  }, [ctx.api, ctx.dataSourceManager, form, message, notification, props, t]);

  return (
    <DrawerFormLayout
      title={t('Sync from database')}
      submitting={submitting}
      submitText={t('Submit')}
      cancelText={t('Cancel')}
      onSubmit={handleSubmit}
    >
      <Spin spinning={loading}>
        <Form form={form} layout="vertical">
          {fields.length ? (
            <Form.Item label={t('Fields')}>
              <AntdTable<ViewFieldRecord>
                bordered
                columns={fieldColumns}
                dataSource={fields}
                pagination={false}
                rowKey="name"
                scroll={{ y: 300 }}
                size="middle"
              />
            </Form.Item>
          ) : null}
          {unsupportedFields.length ? (
            <Alert
              showIcon
              type="warning"
              message={t('Unsupported fields')}
              description={unsupportedFields.map((field) => field.name).join(', ')}
            />
          ) : null}
          <Form.Item label={t('Preview')}>
            <Spin spinning={previewLoading}>
              <AntdTable
                bordered
                columns={previewColumns}
                dataSource={previewData}
                pagination={false}
                rowKey={(_, index) => String(index ?? 0)}
                scroll={{ x: 1000, y: 300 }}
                size="middle"
              />
            </Spin>
          </Form.Item>
        </Form>
      </Spin>
    </DrawerFormLayout>
  );
}

export default function FieldsPage(props: FieldsPageProps) {
  const t = useT();
  const ctx = useFlowContext();
  const appInfo = useCurrentAppInfo<{ database?: { dialect?: string } }>();
  const { message, modal, notification } = App.useApp();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [titleField, setTitleField] = useState<string | undefined>(() =>
    getCollectionTitleField(ctx, props.dataSourceKey, props.collection),
  );
  const [titleFieldLoadingKey, setTitleFieldLoadingKey] = useState<React.Key>();
  const [displayNameLoadingKey, setDisplayNameLoadingKey] = useState<React.Key>();
  const [syncFieldsLoading, setSyncFieldsLoading] = useState(false);
  const request = useRequest(async () => {
    const response = await ctx.api.request({
      url: getCollectionFieldActionUrl(props.dataSourceKey, props.collection.name, 'list'),
      params: {
        paginate: false,
        filter: JSON.stringify({
          $or: [{ 'interface.$not': null }, { 'options.source.$notEmpty': true }],
        }),
        sort: ['sort'],
      },
    });
    return normalizeListResponse(response);
  });

  useEffect(() => {
    setTitleField(getCollectionTitleField(ctx, props.dataSourceKey, props.collection));
  }, [ctx, props.collection, props.collection.titleField, props.dataSourceKey]);

  const dataSource = ctx.dataSourceManager.getDataSource(props.dataSourceKey);
  const dataSourceType = ctx.app.pm.get(PluginDataSourceManagerClientV2)?.getType?.(dataSource?.options?.type);
  const isMainDataSource = props.dataSourceKey === 'main';
  const databaseDialect = getAppInfoDatabaseDialect(appInfo);
  const allFieldInterfaceGroups = useMemo(
    () => getFieldInterfaceOptions(ctx, dataSource?.options?.type),
    [ctx, dataSource?.options?.type],
  );
  const fieldInterfaceGroups = useMemo(
    () =>
      filterCreateFieldInterfacesByDataSource(
        filterCreateFieldInterfaces(
          filterFieldInterfaceGroupsByTemplate(allFieldInterfaceGroups, props.collection, ctx, databaseDialect),
          props.collection,
          ctx,
        ),
        dataSourceType,
        props.collection,
      ),
    [allFieldInterfaceGroups, databaseDialect, ctx, dataSourceType, props.collection],
  );
  const fieldInterfacesByName = useMemo(() => {
    return filterFieldInterfacesByTemplate(
      getFieldInterfaces(ctx, dataSource?.options?.type),
      props.collection,
      ctx,
      databaseDialect,
    ).reduce<Record<string, FieldInterfaceOption>>((memo, fieldInterface) => {
      memo[fieldInterface.name] = fieldInterface;
      return memo;
    }, {});
  }, [databaseDialect, ctx, dataSource?.options?.type, props.collection]);
  const presetFieldInterfaces = useMemo(() => getCollectionPresetFieldInterfaces(ctx), [ctx]);
  const collectionTemplate = useMemo(() => getCollectionTemplate(ctx, props.collection), [ctx, props.collection]);
  const currentFieldsByName = useMemo(() => {
    return new Map((request.data || []).map((field: Record<string, any>) => [String(field.name), field]));
  }, [request.data]);

  const openFieldForm = useCallback(
    (
      mode: 'create' | 'edit',
      field?: Record<string, any>,
      interfaceName?: string,
      options?: { override?: boolean },
    ) => {
      ctx.viewer.drawer({
        width: 800,
        closable: true,
        content: () => (
          <FieldForm
            mode={mode}
            dataSourceKey={props.dataSourceKey}
            collection={props.collection}
            interfaceName={interfaceName}
            field={field}
            override={options?.override}
            onSubmitted={() => request.refresh()}
          />
        ),
      });
    },
    [ctx.viewer, props.collection, props.dataSourceKey, request],
  );

  const addFieldMenu = useMemo<MenuProps>(
    () => ({
      style: {
        maxHeight: '60vh',
        overflow: 'auto',
      },
      items: fieldInterfaceGroups.map((group) => ({
        type: 'group' as const,
        key: group.key,
        label: compileLegacyTemplate(group.label, t),
        children: group.children.map((fieldInterface) => ({
          key: fieldInterface.name,
          label: compileLegacyTemplate(getFieldInterfaceLabel(fieldInterface), t),
        })),
      })),
      onClick: ({ key }) => openFieldForm('create', undefined, String(key)),
    }),
    [fieldInterfaceGroups, openFieldForm, t],
  );

  const TemplateSyncFieldsDrawer = collectionTemplate?.configure?.syncFields?.Component;
  const runtimeCollection = dataSource?.collectionManager?.getCollection?.(props.collection.name);
  const inheritedFieldGroups = getInheritedFieldGroups(runtimeCollection);

  const openTemplateSyncFieldsDrawer = useCallback(() => {
    if (!TemplateSyncFieldsDrawer) {
      return;
    }
    ctx.viewer.drawer({
      width: 900,
      closable: true,
      content: () => (
        <TemplateSyncFieldsDrawer
          collection={props.collection}
          dataSourceKey={props.dataSourceKey}
          onSubmitted={() => {
            request.refresh();
          }}
        />
      ),
    });
  }, [TemplateSyncFieldsDrawer, ctx.viewer, props.collection, props.dataSourceKey, request]);

  const openViewSyncFieldsDrawer = useCallback(() => {
    ctx.viewer.drawer({
      width: 900,
      closable: true,
      content: () => (
        <ViewSyncFieldsDrawer
          collection={props.collection}
          currentFields={(request.data || props.collection.fields || []) as ViewFieldRecord[]}
          fieldInterfaceGroups={allFieldInterfaceGroups}
          fieldInterfacesByName={fieldInterfacesByName}
          onSubmitted={() => {
            request.refresh();
          }}
        />
      ),
    });
  }, [allFieldInterfaceGroups, ctx.viewer, fieldInterfacesByName, props.collection, request]);

  const openInheritedFieldView = useCallback(
    (record: Record<string, any>, parentTitle?: React.ReactNode) => {
      const fieldInterface = record.interface ? fieldInterfacesByName[record.interface] : undefined;
      ctx.viewer.drawer({
        title: `${compileLegacyTemplate(parentTitle || record.collectionName || props.collection.name, t)} - ${t(
          'View',
        )}`,
        width: 520,
        closable: true,
        content: () => <InheritedFieldDetails field={record} fieldInterface={fieldInterface} />,
      });
    },
    [ctx.viewer, fieldInterfacesByName, props.collection.name, t],
  );

  const openInheritedFieldOverride = useCallback(
    (record: Record<string, any>) => {
      if (isInheritedFieldOverridden(record, props.collection.name, currentFieldsByName)) {
        return;
      }
      openFieldForm('create', getOverrideInitialField(record), record.interface, { override: true });
    },
    [currentFieldsByName, openFieldForm, props.collection.name],
  );

  const handleDelete = useCallback(
    (filterByTk: React.Key | React.Key[]) => {
      const keys = (Array.isArray(filterByTk) ? filterByTk : [filterByTk]).filter((key) => {
        const record = currentFieldsByName.get(String(key));
        return record && !isFieldDeleteDisabled(record, collectionTemplate);
      });
      if (!keys.length) {
        return;
      }
      modal.confirm({
        title: t('Delete record'),
        content: t('Are you sure you want to delete it?'),
        async onOk() {
          try {
            await Promise.all(
              keys.map((key) =>
                ctx.api.request({
                  url: getCollectionFieldActionUrl(props.dataSourceKey, props.collection.name, 'destroy', String(key)),
                  method: 'post',
                }),
              ),
            );
            await ctx.dataSourceManager.getDataSource(props.dataSourceKey)?.reload();
            setSelectedRowKeys([]);
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
    [
      collectionTemplate,
      ctx.api,
      ctx.dataSourceManager,
      currentFieldsByName,
      modal,
      notification,
      props.collection.name,
      props.dataSourceKey,
      request,
      t,
    ],
  );

  const handleFieldInterfaceChange = useCallback(
    async (field: Record<string, any>, nextInterfaceName?: string) => {
      const nextInterface = nextInterfaceName ? fieldInterfacesByName[nextInterfaceName] : undefined;
      const nextDefault = nextInterface?.default || {};
      const nextUiSchema = nextDefault.uiSchema
        ? {
            ...nextDefault.uiSchema,
            title: nextDefault.uiSchema.title || field.uiSchema?.title,
          }
        : field.uiSchema;
      try {
        await ctx.api.request({
          url: getCollectionFieldActionUrl(props.dataSourceKey, props.collection.name, 'update', field.name),
          method: 'post',
          data: {
            ...field,
            ...nextDefault,
            name: field.name,
            interface: nextInterfaceName || null,
            type: nextDefault.type || field.type,
            uiSchema: nextUiSchema,
          },
        });
        await ctx.dataSourceManager.getDataSource(props.dataSourceKey)?.reload();
        request.refresh();
      } catch (error) {
        notification.error({
          message: getErrorMessage(error, t('Save failed')),
        });
        throw error;
      }
    },
    [
      ctx.api,
      ctx.dataSourceManager,
      fieldInterfacesByName,
      notification,
      props.collection.name,
      props.dataSourceKey,
      request,
      t,
    ],
  );

  const handleFieldDisplayNameSave = useCallback(
    async (field: Record<string, any>, title: string) => {
      const nextTitle = title.trim();
      if (!nextTitle) {
        message.error(t('Field display name is required'));
        throw new Error('Field display name is required');
      }
      setDisplayNameLoadingKey(field.name);
      try {
        await ctx.api.request({
          url: getCollectionFieldActionUrl(props.dataSourceKey, props.collection.name, 'update', field.name),
          method: 'post',
          data: {
            ...field,
            uiSchema: {
              ...omitRawTitle(field.uiSchema),
              title: nextTitle,
            },
          },
        });
        await ctx.dataSourceManager.getDataSource(props.dataSourceKey)?.reload();
        request.refresh();
        message.success(t('Saved successfully'));
      } catch (error) {
        notification.error({
          message: getErrorMessage(error, t('Save failed')),
        });
        throw error;
      } finally {
        setDisplayNameLoadingKey(undefined);
      }
    },
    [ctx.api, ctx.dataSourceManager, message, notification, props.collection.name, props.dataSourceKey, request, t],
  );

  const handleTitleFieldChange = useCallback(
    async (field: Record<string, any>, checked: boolean) => {
      const nextTitleField = checked ? field.name : 'id';
      setTitleFieldLoadingKey(field.name);
      try {
        await ctx.api.request({
          url: getCollectionUpdateActionUrl(props.dataSourceKey),
          method: 'post',
          params: { filterByTk: props.collection.name },
          data: { titleField: nextTitleField },
        });
        setCollectionTitleField(ctx, props.dataSourceKey, props.collection, nextTitleField);
        setTitleField(nextTitleField);
        props.onCollectionChange?.(props.collection.name, { titleField: nextTitleField });
        await ctx.dataSourceManager.getDataSource(props.dataSourceKey)?.reload();
        message.success(t('Saved successfully'));
      } catch (error) {
        notification.error({
          message: getErrorMessage(error, t('Save failed')),
        });
        throw error;
      } finally {
        setTitleFieldLoadingKey(undefined);
      }
    },
    [ctx, message, notification, props, t],
  );

  const syncFieldsVisible = isSyncFieldsVisible(props.dataSourceKey, props.collection, ctx);
  const configureFieldsDisabled = Boolean(dataSourceType?.disableConfigureFields);
  const fieldDeletionVisible = isMainDataSource && !configureFieldsDisabled;
  const addFieldVisible = isAddFieldVisible({
    collection: props.collection,
    ctx,
    dataSourceType: dataSource?.options?.type,
    fieldInterfaceGroups,
  });

  const inheritedFieldColumns = useMemo<ColumnsType<Record<string, any>>>(
    () => [
      {
        title: t('Field display name'),
        dataIndex: ['uiSchema', 'title'],
        width: 240,
        render: (_, record) => compileLegacyTemplate(getEditableFieldDisplayName(record), t),
      },
      { title: t('Field name'), dataIndex: 'name' },
      { title: t('Field type'), dataIndex: 'type', render: (value) => <Tag>{value}</Tag> },
      {
        title: t('Field interface'),
        dataIndex: 'interface',
        width: 180,
        render: (value) => (
          <Tag>{compileLegacyTemplate(getFieldInterfaceLabel(fieldInterfacesByName[value], value), t)}</Tag>
        ),
      },
      {
        title: t('Title field'),
        dataIndex: 'titleField',
        width: 120,
        render: (_, record) =>
          isTitleField(ctx.dataSourceManager, record) ? (
            <Tooltip title={t('Default title for each record')} placement="right">
              <Switch
                aria-label={`switch-title-field-${record.name}`}
                size="small"
                disabled={configureFieldsDisabled}
                loading={record.name === titleFieldLoadingKey}
                checked={record.name === (titleField || 'id')}
                onChange={(checked) => handleTitleFieldChange(record, checked)}
              />
            </Tooltip>
          ) : null,
      },
      { title: t('Description'), dataIndex: 'description', ellipsis: true },
      {
        title: t('Actions'),
        width: 160,
        render: (_, record) => {
          const overridden = isInheritedFieldOverridden(record, props.collection.name, currentFieldsByName);
          return (
            <Space>
              {configureFieldsDisabled ? null : (
                <Typography.Link disabled={overridden} onClick={() => openInheritedFieldOverride(record)}>
                  {t('Override')}
                </Typography.Link>
              )}
              <Typography.Link onClick={() => openInheritedFieldView(record, record.__parentTitle)}>
                {t('View')}
              </Typography.Link>
            </Space>
          );
        },
      },
    ],
    [
      configureFieldsDisabled,
      ctx.dataSourceManager,
      currentFieldsByName,
      fieldInterfacesByName,
      handleTitleFieldChange,
      openInheritedFieldOverride,
      openInheritedFieldView,
      props.collection.name,
      t,
      titleField,
      titleFieldLoadingKey,
    ],
  );

  const inheritedGroupColumns = useMemo<ColumnsType<InheritedFieldGroup>>(
    () => [
      {
        dataIndex: 'title',
        render: (_, record) => (
          <strong>
            {t('Inherited fields')} - {compileLegacyTemplate(record.title || record.collectionName, t)}
          </strong>
        ),
      },
    ],
    [t],
  );

  const handleSyncFields = useCallback(async () => {
    if (TemplateSyncFieldsDrawer) {
      openTemplateSyncFieldsDrawer();
      return;
    }

    if (isViewCollection(props.collection)) {
      openViewSyncFieldsDrawer();
      return;
    }

    setSyncFieldsLoading(true);
    try {
      await ctx.api.resource('mainDataSource').syncFields({
        values: {
          collections: [props.collection.name],
        },
      });
      request.refresh();
      await ctx.dataSourceManager.getDataSource('main')?.reload();
      message.success(t('Sync successfully'));
    } catch (error) {
      notification.error({
        message: getErrorMessage(error, t('Sync failed')),
      });
      throw error;
    } finally {
      setSyncFieldsLoading(false);
    }
  }, [
    ctx.api,
    ctx.dataSourceManager,
    message,
    notification,
    openTemplateSyncFieldsDrawer,
    openViewSyncFieldsDrawer,
    props.collection,
    request,
    TemplateSyncFieldsDrawer,
    t,
  ]);

  useEffect(() => {
    if (!fieldDeletionVisible) {
      setSelectedRowKeys([]);
    }
  }, [fieldDeletionVisible]);

  const columns = useMemo<ColumnsType<Record<string, any>>>(() => {
    const nextColumns: ColumnsType<Record<string, any>> = [
      {
        title: t('Field display name'),
        width: 240,
        render: (record) =>
          configureFieldsDisabled ? (
            compileLegacyTemplate(getEditableFieldDisplayName(record), t)
          ) : (
            <EditableFieldDisplayNameCell
              loading={displayNameLoadingKey === record.name}
              record={record}
              onSave={handleFieldDisplayNameSave}
            />
          ),
      },
      { title: t('Field name'), dataIndex: 'name' },
      { title: t('Field type'), dataIndex: 'type', render: (value) => <Tag>{value}</Tag> },
      {
        title: t('Field interface'),
        dataIndex: 'interface',
        width: 180,
        render: (value, record) => {
          const currentFieldInterface = value ? fieldInterfacesByName[value] : undefined;
          const optionsGroups = getSelectableFieldInterfaceGroups(allFieldInterfaceGroups, record);
          if (
            configureFieldsDisabled ||
            (value && !currentFieldInterface) ||
            isReadOnlyFieldInterface(record, {
              collection: props.collection,
              currentFieldInterface,
              dataSourceType,
              presetFieldInterfaces,
            }) ||
            !optionsGroups.length
          ) {
            return <Tag>{compileLegacyTemplate(getFieldInterfaceLabel(currentFieldInterface, value), t) || value}</Tag>;
          }

          const options = optionsGroups
            .map((group) => ({
              label: compileLegacyTemplate(group.label, t),
              options: group.children.map((fieldInterface) => ({
                value: fieldInterface.name,
                label: compileLegacyTemplate(getFieldInterfaceLabel(fieldInterface), t),
              })),
            }))
            .filter((group) => group.options.length);

          return (
            <Select
              allowClear
              value={value || undefined}
              style={{ width: '100%' }}
              popupMatchSelectWidth={false}
              options={options}
              onChange={(nextValue) => handleFieldInterfaceChange(record, nextValue)}
            />
          );
        },
      },
      {
        title: t('Title field'),
        dataIndex: 'titleField',
        width: 120,
        render: (_, record) =>
          isTitleField(ctx.dataSourceManager, record) ? (
            <Tooltip title={t('Default title for each record')} placement="right">
              <Switch
                aria-label={`switch-title-field-${record.name}`}
                size="small"
                disabled={configureFieldsDisabled}
                loading={record.name === titleFieldLoadingKey}
                checked={record.name === (titleField || 'id')}
                onChange={(checked) => handleTitleFieldChange(record, checked)}
              />
            </Tooltip>
          ) : null,
      },
      { title: t('Description'), dataIndex: 'description', ellipsis: true },
    ];

    if (!configureFieldsDisabled) {
      nextColumns.push({
        title: t('Actions'),
        width: 160,
        render: (_, record) => (
          <Space>
            <a onClick={() => openFieldForm('edit', record)}>{t('Edit')}</a>
            {fieldDeletionVisible ? (
              <Typography.Link
                disabled={isFieldDeleteDisabled(record, collectionTemplate)}
                onClick={() => handleDelete(record.name)}
              >
                {t('Delete')}
              </Typography.Link>
            ) : null}
          </Space>
        ),
      });
    }

    return nextColumns;
  }, [
    allFieldInterfaceGroups,
    configureFieldsDisabled,
    fieldDeletionVisible,
    collectionTemplate,
    ctx.dataSourceManager,
    dataSourceType,
    fieldInterfacesByName,
    handleDelete,
    handleFieldDisplayNameSave,
    handleFieldInterfaceChange,
    handleTitleFieldChange,
    openFieldForm,
    presetFieldInterfaces,
    props.collection,
    t,
    displayNameLoadingKey,
    titleField,
    titleFieldLoadingKey,
  ]);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 16 }}>
        <Space>
          {fieldDeletionVisible ? (
            <Button
              icon={<DeleteOutlined />}
              disabled={!selectedRowKeys.length}
              onClick={() => handleDelete(selectedRowKeys)}
            >
              {t('Delete')}
            </Button>
          ) : null}
          {syncFieldsVisible ? (
            <Button icon={<SyncOutlined />} loading={syncFieldsLoading} onClick={handleSyncFields}>
              {t('Sync from database')}
            </Button>
          ) : null}
          {addFieldVisible ? (
            <Dropdown menu={addFieldMenu} placement="bottomRight" trigger={['hover']}>
              <Button type="primary" icon={<PlusOutlined />}>
                {t('Add field')} <DownOutlined />
              </Button>
            </Dropdown>
          ) : null}
        </Space>
      </div>
      <Table<Record<string, any>>
        rowKey="name"
        loading={request.loading}
        dataSource={request.data || []}
        columns={columns}
        pagination={false}
        rowSelection={
          fieldDeletionVisible
            ? {
                selectedRowKeys,
                onChange: setSelectedRowKeys,
                getCheckboxProps: (record) => ({
                  disabled: isFieldDeleteDisabled(record, collectionTemplate),
                }),
              }
            : undefined
        }
      />
      {inheritedFieldGroups.some((group) => group.fields.length) ? (
        <AntdTable<InheritedFieldGroup>
          style={{ marginTop: 16 }}
          rowKey="key"
          columns={inheritedGroupColumns}
          dataSource={inheritedFieldGroups.filter((group) => group.fields.length)}
          pagination={false}
          showHeader={false}
          expandable={{
            defaultExpandAllRows: true,
            defaultExpandedRowKeys: inheritedFieldGroups.map((group) => group.key),
            expandedRowRender: (record) => (
              <AntdTable<Record<string, any>>
                rowKey="name"
                columns={inheritedFieldColumns}
                dataSource={record.fields.map((field) => ({
                  ...field,
                  __parentTitle: record.title,
                }))}
                pagination={false}
                showHeader={false}
              />
            ),
          }}
        />
      ) : null}
    </>
  );
}
