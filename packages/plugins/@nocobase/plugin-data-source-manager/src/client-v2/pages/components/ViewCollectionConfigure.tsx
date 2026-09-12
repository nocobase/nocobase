/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlowContext } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import { Alert, Cascader, Form, Input, Select, Spin, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { get } from 'lodash';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CollectionTemplateConfigureItemProps } from '../../plugin';
import { useT } from '../../locale';
import { compileLegacyTemplate } from '../../utils/compileLegacyTemplate';
import { UnsupportedFields } from './UnsupportedFields';

type ViewRecord = {
  name: string;
  schema?: string;
};

type CollectionRecord = {
  fields?: ViewFieldRecord[];
  inherits?: string[];
  name?: string;
  title?: React.ReactNode;
};

type FieldInterfaceRecord = {
  availableTypes?: string[];
  default?: {
    type?: string;
    uiSchema?: Record<string, unknown>;
  };
  group?: string;
  name?: string;
  order?: number;
  title?: React.ReactNode;
};

type FieldInterfaceGroup = {
  label?: React.ReactNode;
  order?: number;
};

type FieldInterfaceManager = {
  getFieldInterface?: (name?: string) => FieldInterfaceRecord | undefined;
  getFieldInterfaceGroups?: () => Record<string, FieldInterfaceGroup>;
  getFieldInterfaces?: () => FieldInterfaceRecord[];
};

export type ViewFieldRecord = {
  interface?: string;
  name: string;
  possibleTypes?: string[];
  source?: string | string[] | null;
  title?: React.ReactNode;
  type?: string;
  uiSchema?: Record<string, unknown>;
  [key: string]: unknown;
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

const relationTypes = new Set(['hasOne', 'hasMany', 'belongsToMany']);
const internalUnsupportedFieldsName = '__viewUnsupportedFields';

function normalizeArrayResponse(response: unknown) {
  const payload = get(response, 'data.data');
  return Array.isArray(payload) ? payload : Array.isArray(get(payload, 'data')) ? get(payload, 'data') : [];
}

function normalizeViewFieldsPayload(value: unknown): ViewFieldsResponse {
  const payload = get(value, 'data.data') || get(value, 'data') || value || {};
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

function omitRawTitle(uiSchema?: Record<string, unknown>) {
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

function getFieldTitle(field: ViewFieldRecord) {
  const options = getFieldOptions(field);
  return (options.uiSchema?.title as React.ReactNode) || options.title || options.name;
}

function getFieldOptions(field: any) {
  return field?.options || field || {};
}

function getCollectionOptions(collections: CollectionRecord[], t: (key: string) => string) {
  return collections
    .filter((collection) => collection.name)
    .map((collection) => ({
      value: collection.name,
      label: compileLegacyTemplate(collection.title || collection.name, t),
    }));
}

function parseDatabaseViewValue(value?: string | null) {
  if (!value) {
    return {
      schema: null,
      viewName: null,
    };
  }
  const [schema, viewName] = value.includes('@') ? value.split('@') : [null, value];
  return {
    schema: schema || null,
    viewName: viewName || value,
  };
}

function getDatabaseViewValue(record: ViewRecord) {
  return record.schema ? `${record.schema}@${record.name}` : record.name;
}

function mergeViewFields(options: {
  currentFields?: ViewFieldRecord[];
  fieldInterfacesByName: Record<string, FieldInterfaceRecord>;
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

function getFieldInterfaceOptions(manager: FieldInterfaceManager) {
  const groups = manager?.getFieldInterfaceGroups?.() || {};
  const interfaces = manager?.getFieldInterfaces?.() || [];
  const grouped = new Map<string, Array<{ label: React.ReactNode; value: string; availableTypes?: string[] }>>();

  interfaces
    .filter(
      (fieldInterface) => fieldInterface.name && !['relation', 'systemInfo'].includes(String(fieldInterface.group)),
    )
    .forEach((fieldInterface) => {
      const group = String(fieldInterface.group || 'other');
      const items = grouped.get(group) || [];
      items.push({
        value: String(fieldInterface.name),
        label: fieldInterface.title || String(fieldInterface.name),
        availableTypes: fieldInterface.availableTypes,
      });
      grouped.set(group, items);
    });

  return Array.from(grouped.entries())
    .sort(([groupA], [groupB]) => (groups[groupA]?.order ?? 0) - (groups[groupB]?.order ?? 0))
    .map(([group, options]) => ({
      label: groups[group]?.label || group,
      options,
    }));
}

function useCollections() {
  const ctx = useFlowContext();

  return useRequest(async () => {
    const response = await ctx.api.request({
      url: 'dataSources/main/collections:list',
      params: {
        paginate: false,
        sort: ['sort'],
        filter: {
          'hidden.$isFalsy': true,
        },
        appends: ['fields'],
      },
    });
    return normalizeArrayResponse(response) as CollectionRecord[];
  });
}

export function ViewDatabaseConfigureItem(props: CollectionTemplateConfigureItemProps) {
  const ctx = useFlowContext();
  const t = useT();
  const manager = ctx.dataSourceManager.collectionFieldInterfaceManager as FieldInterfaceManager;
  const autoNameRef = useRef<string>();
  const [loadingFields, setLoadingFields] = useState(false);
  const watchedDatabaseView = Form.useWatch('databaseView', props.form);
  const watchedSchema = Form.useWatch('schema', props.form);
  const watchedViewName = Form.useWatch('viewName', props.form);
  const currentDatabaseView = useMemo(() => {
    if (watchedDatabaseView) {
      return watchedDatabaseView;
    }
    if (!watchedViewName) {
      return undefined;
    }
    return watchedSchema ? `${watchedSchema}@${watchedViewName}` : watchedViewName;
  }, [watchedDatabaseView, watchedSchema, watchedViewName]);
  const fieldInterfacesByName = useMemo(() => {
    return (manager?.getFieldInterfaces?.() || []).reduce<Record<string, FieldInterfaceRecord>>(
      (memo, fieldInterface) => {
        if (fieldInterface.name) {
          memo[fieldInterface.name] = fieldInterface;
        }
        return memo;
      },
      {},
    );
  }, [manager]);
  const viewsRequest = useRequest(async () => {
    const response = await ctx.api.resource('dbViews').list();
    return normalizeArrayResponse(response) as ViewRecord[];
  });
  const viewOptions = useMemo(() => {
    const options = (viewsRequest.data || []).map((view) => ({
      value: getDatabaseViewValue(view),
      label: view.schema
        ? `${view.schema}.${compileLegacyTemplate(view.name, t)}`
        : compileLegacyTemplate(view.name, t),
    }));
    if (currentDatabaseView && !options.some((option) => option.value === currentDatabaseView)) {
      options.unshift({
        value: currentDatabaseView,
        label: watchedSchema
          ? `${watchedSchema}.${compileLegacyTemplate(watchedViewName || currentDatabaseView, t)}`
          : compileLegacyTemplate(watchedViewName || currentDatabaseView, t),
      });
    }
    return options;
  }, [currentDatabaseView, t, viewsRequest.data, watchedSchema, watchedViewName]);

  const loadViewFields = useCallback(
    async (viewName: string, schema?: string | null) => {
      setLoadingFields(true);
      try {
        const response = await ctx.api.resource('dbViews').get({
          filterByTk: viewName,
          schema: schema || undefined,
        });
        const payload = normalizeViewFieldsPayload(response);
        const currentFields = props.form.getFieldValue('fields') || [];
        const fields = mergeViewFields({
          currentFields: Array.isArray(currentFields) ? currentFields : [],
          fieldInterfacesByName,
          inferredFields: normalizeViewFields(payload.fields),
        });
        const sources = Array.isArray(payload.sources) ? payload.sources : [];
        props.form.setFieldsValue({
          fields: fields.map((field) => ({
            ...field,
            source: normalizeSource(field.source),
          })),
          sources,
          [internalUnsupportedFieldsName]: Array.isArray(payload.unsupportedFields) ? payload.unsupportedFields : [],
        });
      } finally {
        setLoadingFields(false);
      }
    },
    [ctx.api, fieldInterfacesByName, props.form],
  );

  const handleChange = useCallback(
    (value?: string) => {
      const { schema, viewName } = parseDatabaseViewValue(value);
      props.form.setFieldsValue({
        databaseView: value,
        schema,
        viewName,
        fields: [],
        sources: [],
        [internalUnsupportedFieldsName]: [],
      });

      if (viewName) {
        const currentName = props.form.getFieldValue('name');
        if (
          !props.form.isFieldTouched('name') ||
          currentName === autoNameRef.current ||
          /^t_[A-Za-z0-9]+$/.test(currentName)
        ) {
          autoNameRef.current = viewName;
          props.form.setFieldValue('name', viewName);
        }
        loadViewFields(viewName, schema);
      }
    },
    [loadViewFields, props.form],
  );

  useEffect(() => {
    if (!watchedDatabaseView && currentDatabaseView) {
      props.form.setFieldValue('databaseView', currentDatabaseView);
    }
  }, [currentDatabaseView, props.form, watchedDatabaseView]);

  return (
    <Spin spinning={loadingFields}>
      <Form.Item
        name="databaseView"
        label={t('Connect to database view')}
        rules={[{ required: true, message: t('Please select a database view') }]}
      >
        <Select
          allowClear
          loading={viewsRequest.loading}
          options={viewOptions}
          showSearch
          optionFilterProp="label"
          disabled={props.mode === 'edit'}
          onChange={handleChange}
        />
      </Form.Item>
      <Form.Item name="schema" hidden>
        <Input />
      </Form.Item>
      <Form.Item name="viewName" hidden rules={[{ required: true }]}>
        <Input />
      </Form.Item>
    </Spin>
  );
}

export function ViewSourcesConfigureItem(props: CollectionTemplateConfigureItemProps) {
  const t = useT();
  const collectionsRequest = useCollections();
  const watchedSources = Form.useWatch('sources', props.form);
  const sources = useMemo(() => (Array.isArray(watchedSources) ? watchedSources : []), [watchedSources]);
  const options = useMemo(() => {
    const collectionOptions = getCollectionOptions(collectionsRequest.data || [], t);
    const missingOptions = sources
      .filter((source) => !collectionOptions.some((option) => option.value === source))
      .map((source) => ({ value: source, label: source }));

    return [...collectionOptions, ...missingOptions];
  }, [collectionsRequest.data, sources, t]);

  return (
    <Form.Item name="sources" label={t('Source collections')}>
      <Select mode="multiple" options={options} loading={collectionsRequest.loading} disabled allowClear />
    </Form.Item>
  );
}

export function ViewFieldsConfigureItem(props: CollectionTemplateConfigureItemProps) {
  const ctx = useFlowContext();
  const t = useT();
  const collectionsRequest = useCollections();
  const manager = ctx.dataSourceManager.collectionFieldInterfaceManager as FieldInterfaceManager;
  const mainDataSource = ctx.dataSourceManager.getDataSource('main');
  const watchedFields = Form.useWatch('fields', props.form);
  const watchedSources = Form.useWatch('sources', props.form);
  const unsupportedFields = Form.useWatch(internalUnsupportedFieldsName, { form: props.form, preserve: true }) as
    | ViewFieldRecord[]
    | undefined;
  const fields = useMemo(() => (Array.isArray(watchedFields) ? watchedFields : []), [watchedFields]);
  const sources = useMemo(() => (Array.isArray(watchedSources) ? watchedSources : []), [watchedSources]);
  const fieldOptions = useMemo(() => getFieldInterfaceOptions(manager), [manager]);
  const sourceFieldOptions = useMemo<SourceFieldOption[]>(() => {
    return sources
      .map((source) => (collectionsRequest.data || []).find((collection) => collection.name === source))
      .filter(Boolean)
      .map((collection) => {
        const runtimeCollection = mainDataSource?.getCollection?.(collection.name);
        const sourceFields =
          typeof runtimeCollection?.getFields === 'function' ? runtimeCollection.getFields() : collection.fields || [];
        return {
          value: collection.name,
          label: compileLegacyTemplate(collection.title || runtimeCollection?.title || collection.name, t),
          children: sourceFields
            .map(getFieldOptions)
            .filter((field) => field.name && !relationTypes.has(String(field.type)))
            .map((field) => ({
              value: field.name,
              label: compileLegacyTemplate(getFieldTitle(field), t),
            })),
        };
      });
  }, [collectionsRequest.data, mainDataSource, sources, t]);

  const updateField = useCallback(
    (index: number, nextField: ViewFieldRecord) => {
      const nextFields = [...fields];
      nextFields.splice(index, 1, {
        ...nextField,
        source: normalizeSource(nextField.source),
      });
      props.form.setFieldValue('fields', nextFields);
    },
    [fields, props.form],
  );

  const columns: ColumnsType<ViewFieldRecord> = [
    {
      title: t('Field name'),
      dataIndex: 'name',
      width: 130,
    },
    {
      title: t('Field source'),
      dataIndex: 'source',
      width: 220,
      render: (value, record, index) => (
        <Cascader
          allowClear
          options={sourceFieldOptions}
          placeholder={t('Select field source')}
          value={toSourcePath(value)}
          onChange={(nextValue) => {
            const sourcePath = (nextValue || []).map(String);
            const sourceCollection = (collectionsRequest.data || []).find(
              (collection) => collection.name === sourcePath[0],
            );
            const runtimeCollection = sourcePath[0] ? mainDataSource?.getCollection?.(sourcePath[0]) : undefined;
            const sourceFields =
              typeof runtimeCollection?.getFields === 'function'
                ? runtimeCollection.getFields().map(getFieldOptions)
                : sourceCollection?.fields || [];
            const sourceField = sourceFields.find((field) => field.name === sourcePath[1]);
            updateField(index, {
              ...record,
              source: sourcePath,
              interface: sourceField?.interface || record.interface,
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
            onChange={(nextType) => updateField(index, { ...record, type: nextType })}
          />
        ),
    },
    {
      title: t('Field interface'),
      dataIndex: 'interface',
      width: 180,
      render: (value, record, index) => {
        if (record.source) {
          const fieldInterface = manager?.getFieldInterface?.(value);
          return <Tag>{compileLegacyTemplate(fieldInterface?.title || value, t)}</Tag>;
        }

        return (
          <Select
            allowClear
            popupMatchSelectWidth={false}
            style={{ width: '100%' }}
            options={fieldOptions.map((group) => ({
              label: compileLegacyTemplate(group.label, t),
              options: group.options
                .filter((option) => !record.type || option.availableTypes?.includes(record.type))
                .map((option) => ({
                  value: option.value,
                  label: compileLegacyTemplate(option.label, t),
                })),
            }))}
            value={value || undefined}
            onChange={(nextInterface) => {
              const fieldInterface = manager?.getFieldInterface?.(nextInterface);
              updateField(index, {
                ...record,
                interface: nextInterface || null,
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
      width: 180,
      render: (_, record, index) => (
        <Input
          value={(record.uiSchema?.title as string) || record.name}
          onChange={(event) => {
            updateField(index, {
              ...record,
              uiSchema: {
                ...omitRawTitle(record.uiSchema),
                title: event.target.value,
              },
            });
          }}
        />
      ),
    },
  ];

  if (collectionsRequest.loading) {
    return <Spin />;
  }

  return (
    <>
      <Form.Item name="fields" hidden rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      {fields.length ? (
        <Form.Item
          label={t('Fields')}
          required
          extra={t('Fields can only be used correctly if they are defined with an interface.')}
        >
          <Table bordered columns={columns} dataSource={fields} pagination={false} rowKey="name" scroll={{ y: 300 }} />
        </Form.Item>
      ) : (
        <Form.Item label={t('Fields')} required>
          <Alert showIcon message={t('Please select a database view')} />
        </Form.Item>
      )}
      <UnsupportedFields dataSource={unsupportedFields} style={{ marginBottom: 24 }} />
    </>
  );
}

export function ViewPreviewConfigureItem(props: CollectionTemplateConfigureItemProps) {
  const ctx = useFlowContext();
  const t = useT();
  const viewName = Form.useWatch('viewName', props.form);
  const schema = Form.useWatch('schema', props.form);
  const watchedFields = Form.useWatch('fields', props.form);
  const fields = useMemo(() => (Array.isArray(watchedFields) ? watchedFields : []), [watchedFields]);
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState<Array<Record<string, unknown>>>([]);
  const fieldTypesKey = useMemo(() => {
    const mapFieldTypes = ['lineString', 'point', 'circle', 'polygon'];
    const fieldTypes = fields.reduce<Record<string, string>>((memo, field) => {
      if (field.type && mapFieldTypes.includes(field.type)) {
        memo[field.name] = field.type;
      }
      return memo;
    }, {});
    return JSON.stringify(fieldTypes);
  }, [fields]);

  const columns = useMemo<ColumnsType<Record<string, unknown>>>(() => {
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

  useEffect(() => {
    if (!viewName || !fields.length) {
      setDataSource([]);
      return;
    }

    let ignore = false;
    const loadPreview = async () => {
      setLoading(true);
      try {
        const response = await ctx.api.resource('dbViews').query({
          filterByTk: viewName,
          schema: schema || undefined,
          fieldTypes: JSON.parse(fieldTypesKey) as Record<string, string>,
        });
        if (!ignore) {
          setDataSource(normalizeArrayResponse(response) as Array<Record<string, unknown>>);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadPreview();

    return () => {
      ignore = true;
    };
  }, [ctx.api, fieldTypesKey, fields.length, schema, viewName]);

  return (
    <Form.Item label={t('Preview')}>
      <Spin spinning={loading}>
        <Table
          bordered
          columns={columns}
          dataSource={dataSource}
          pagination={false}
          rowKey={(_, index) => String(index ?? 0)}
          scroll={{ x: 1000, y: 300 }}
        />
      </Spin>
    </Form.Item>
  );
}

export function normalizeViewCollectionSubmitValues(values: Record<string, unknown>) {
  const submitValues = { ...values };
  delete submitValues[internalUnsupportedFieldsName];
  if (Array.isArray(submitValues.fields)) {
    submitValues.fields = submitValues.fields.map((field) => ({
      ...(field as Record<string, unknown>),
      source: normalizeSource((field as ViewFieldRecord).source),
    }));
  }
  return submitValues;
}
