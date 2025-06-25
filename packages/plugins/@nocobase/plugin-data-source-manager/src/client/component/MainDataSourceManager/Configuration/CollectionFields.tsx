/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { createForm, Field } from '@formily/core';
import { FieldContext, FormContext, useField } from '@formily/react';
import {
  Action,
  AddCollectionField,
  EditCollectionField,
  Input,
  isDeleteButtonDisabled,
  OverridingCollectionField,
  RecordProvider,
  ResourceActionContext,
  ResourceActionProvider,
  SchemaComponent,
  SyncFieldsAction,
  SyncSQLFieldsAction,
  useAPIClient,
  useAttach,
  useBulkDestroyActionAndRefreshCM,
  useCollectionManager_deprecated,
  useCompile,
  useCurrentAppInfo,
  useDestroyActionAndRefreshCM,
  useRecord,
  useResourceActionContext,
  useResourceContext,
  ViewCollectionField,
} from '@nocobase/client';
import { Cascader, message, Select, Space, Switch, Table, TableColumnProps, Tag, Tooltip } from 'antd';
import React, { createContext, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { FilterTargetKeyAlert } from '../../CollectionsManager/FilterTargetKeyAlert';
import { collection } from './schemas/collectionFields';
const resourceActionProps = {
  association: {
    sourceKey: 'name',
    targetKey: 'name',
  },
  collection,
  request: {
    resource: 'collections.fields',
    action: 'list',
    params: {
      paginate: false,
      filter: {
        $or: [{ 'interface.$not': null }, { 'options.source.$notEmpty': true }],
      },
      sort: ['sort'],
    },
  },
};

export const CollectionListContext = createContext(null);

const CollectionFieldsProvider = (props) => {
  return (
    <CollectionListContext.Provider value={useResourceActionContext()}>
      <ResourceActionProvider {...resourceActionProps}>{props.children}</ResourceActionProvider>
    </CollectionListContext.Provider>
  );
};

const tableContainer = css`
  tr {
    display: flex;
  }
  td,
  th {
    flex: 1.5;
    width: 0;
    &:nth-child(4) {
      flex: 1.8; /* Field interface column */
    }
    &:nth-child(5) {
      flex: 1.8; /* Field type column */
    }
    &:nth-child(6) {
      flex: 1.2; /* Title field column */
    }
    &:nth-child(7) {
      flex: 2; /* Description column */
    }
    &:last-child {
      flex: 1.5; /* Actions column */
    }
  }
  .ant-table-selection-column {
    min-width: 50px;
    flex-basis: 50px !important;
    flex: 0;
  }

  .ant-table-row-expand-icon-cell {
    flex: 0;
    flex-basis: 30px !important;
  }
`;

const titlePrompt = 'Default title for each record';

const convertFieldTypeToOptions = (fieldType: string[]) => {
  if (!fieldType || !Array.isArray(fieldType) || fieldType.length === 0) {
    return [];
  }

  const fieldTypeHierarchy = {
    string: [
      { label: 'varchar', value: 'varchar' },
      { label: 'char', value: 'char' },
      { label: 'text', value: 'text' },
    ],
    integer: [
      { label: 'int', value: 'int' },
      { label: 'bigint', value: 'bigint' },
      { label: 'smallint', value: 'smallint' },
    ],
    float: [
      { label: 'decimal', value: 'decimal' },
      { label: 'double', value: 'double' },
    ],
    boolean: [{ label: 'boolean', value: 'boolean' }],
    date: [
      { label: 'date', value: 'date' },
      { label: 'datetime', value: 'datetime' },
      { label: 'timestamp', value: 'timestamp' },
    ],
  };

  if (fieldType.length >= 1) {
    const firstLevel = fieldType[0];
    const children = fieldTypeHierarchy[firstLevel] || [];

    return [
      {
        label: firstLevel,
        value: firstLevel,
        children: children.length > 0 ? children : undefined,
      },
    ];
  }

  return [];
};

const CurrentFields = (props) => {
  const compile = useCompile();
  const { getInterface, interfaces } = useCollectionManager_deprecated();
  const { t } = useTranslation();
  const { setState } = useResourceActionContext();
  const { targetKey } = props.collectionResource || {};
  const parentRecordData = useRecord();
  const [loadingRecord, setLoadingRecord] = React.useState<any>(null);
  const { refreshCM, isTitleField, getTemplate } = useCollectionManager_deprecated();
  const { [targetKey]: filterByTk, titleField, template } = parentRecordData;
  const targetTemplate = getTemplate(template);
  const api = useAPIClient();
  const ctx = useContext(CollectionListContext);
  const columns: TableColumnProps<any>[] = [
    {
      dataIndex: ['uiSchema', 'title'],
      title: t('Field display name'),
      render: (value) => <div style={{ marginLeft: 7 }}>{compile(value)}</div>,
    },
    {
      dataIndex: 'name',
      title: t('Field name'),
    },
    {
      dataIndex: 'interface',
      title: t('Field interface'),
      render: (value, record) => {
        const handleChange = async (selectedInterface) => {
          try {
            await api.request({
              url: `collections.fields:update?filterByTk=${record.name}&associatedIndex=${filterByTk}`,
              method: 'post',
              data: { interface: selectedInterface },
            });
            ctx?.refresh?.();
            await props.refreshAsync();
            refreshCM();
            message.success(t('Saved successfully'));
          } catch (error) {
            console.error('Failed to update field interface:', error);
            message.error(t('Save failed'));
          }
        };

        return (
          <Select
            value={value}
            onChange={handleChange}
            placeholder={t('Select field interface')}
            size="small"
            style={{ width: '100%', minWidth: 120 }}
            disabled={targetTemplate?.forbidDeletion}
            showSearch
            filterOption={(input, option) => {
              const label = option?.children || '';
              return String(label).toLowerCase().includes(input.toLowerCase());
            }}
          >
            {Object.keys(interfaces).map((interfaceKey) => {
              const interfaceItem = interfaces[interfaceKey];
              return (
                <Select.Option key={interfaceKey} value={interfaceKey}>
                  {compile(interfaceItem.title)}
                </Select.Option>
              );
            })}
          </Select>
        );
      },
    },
    {
      dataIndex: 'fieldType',
      title: t('Field type'),
      render: (value, record) => {
        const handleChange = async (selectedValues) => {
          try {
            // await api.request({
            //   url: `collections.fields:update?filterByTk=${record.name}&associatedIndex=${filterByTk}`,
            //   method: 'post',
            //   data: { fieldType: selectedValues },
            // });
            ctx?.refresh?.();
            await props.refreshAsync();
            refreshCM();
            message.success(t('Saved successfully'));
          } catch (error) {
            console.error('Failed to update field type:', error);
            message.error(t('Save failed'));
          }
        };

        return value && Array.isArray(value) && value.length > 0 ? (
          <Cascader
            value={value}
            options={convertFieldTypeToOptions(value)}
            onChange={handleChange}
            placeholder={t('Select field type')}
            expandTrigger="hover"
            changeOnSelect={true}
            size="small"
            style={{ width: '100%', minWidth: 120 }}
            disabled={targetTemplate?.forbidDeletion}
          />
        ) : (
          <span style={{ color: '#ccc' }}>-</span>
        );
      },
    },
    {
      dataIndex: 'titleField',
      title: t('Title field'),
      render: function Render(_, record) {
        const handleChange = async (checked) => {
          setLoadingRecord(record);
          await api.request({
            url: `collections:update?filterByTk=${filterByTk}`,
            method: 'post',
            data: { titleField: checked ? record.name : 'id' },
          });
          ctx?.refresh?.();
          await props.refreshAsync();
          setLoadingRecord(null);
          refreshCM();
          message.success(t('Saved successfully'));
        };

        return isTitleField(record) ? (
          <Tooltip title={t(titlePrompt)} placement="right" overlayInnerStyle={{ textAlign: 'center' }}>
            <Switch
              aria-label={`switch-title-field-${record.name}`}
              size="small"
              loading={record.name === loadingRecord?.name}
              checked={record.name === (titleField || 'id')}
              onChange={handleChange}
            />
          </Tooltip>
        ) : null;
      },
    },
    {
      dataIndex: 'description',
      title: t('Descriptio '),
      render: (value) => <Input.ReadPretty value={value} ellipsis={true} />,
    },
    {
      dataIndex: 'actions',
      title: t('Actions'),
      render: (_, record) => {
        const deleteProps = {
          confirm: {
            title: t('Delete record'),
            content: t('Are you sure you want to delete it?'),
          },
          useAction: useDestroyActionAndRefreshCM,
          disabled: isDeleteButtonDisabled(record) || targetTemplate?.forbidDeletion,
          title: t('Delete'),
        };

        return (
          <RecordProvider record={record} parent={parentRecordData}>
            <Space size="middle">
              <EditCollectionField role="button" aria-label={`edit-button-${record.name}`} type="primary" />
              <Action.Link {...deleteProps} />
            </Space>
          </RecordProvider>
        );
      },
    },
  ];
  return (
    <Table
      rowKey={'name'}
      columns={columns}
      showHeader={props.showHeader !== false}
      pagination={false}
      dataSource={props.fields}
      rowSelection={{
        type: 'checkbox',
        // @ts-ignore
        getCheckboxProps(record) {
          return {
            'aria-label': `checkbox-${record.name}`,
          };
        },
        onChange: (selectedRowKeys) => {
          setState((state) => {
            return {
              ...state,
              [props.type]: selectedRowKeys,
            };
          });
        },
      }}
    />
  );
};

const InheritFields = (props) => {
  const compile = useCompile();
  const { getInterface } = useCollectionManager_deprecated();
  const { targetKey } = props.collectionResource || {};
  const parentRecord = useRecord();
  const [loadingRecord, setLoadingRecord] = React.useState(null);
  const { t } = useTranslation();
  const { refreshCM, isTitleField } = useCollectionManager_deprecated();
  const { [targetKey]: filterByTk, titleField, name } = parentRecord;
  const ctx = useContext(CollectionListContext);
  const api = useAPIClient();

  const columns: TableColumnProps<any>[] = [
    {
      dataIndex: ['uiSchema', 'rawTitle'],
      title: t('Field display name'),
      render: (value) => <div style={{ marginLeft: 1 }}>{compile(value)}</div>,
    },
    {
      dataIndex: 'name',
      title: t('Field name'),
    },
    {
      dataIndex: 'interface',
      title: t('Field interface'),
      render: (value) => <Tag>{compile(getInterface(value)?.title)}</Tag>,
    },
    {
      dataIndex: 'fieldType',
      title: t('Field type'),
      render: (value) => {
        return value && Array.isArray(value) && value.length > 0 ? (
          <Cascader
            value={value}
            options={convertFieldTypeToOptions(value)}
            placeholder={t('Select field type')}
            expandTrigger="hover"
            changeOnSelect={true}
            size="small"
            style={{ width: '100%', minWidth: 120 }}
            disabled={true}
            open={false}
          />
        ) : (
          <span style={{ color: '#ccc' }}>-</span>
        );
      },
    },
    {
      dataIndex: 'titleField',
      title: t('Title field'),
      render(_, record) {
        const handleChange = async (checked) => {
          setLoadingRecord(record);

          await api.request({
            url: `collections:update?filterByTk=${filterByTk}`,
            method: 'post',
            data: { titleField: checked ? record.name : 'id' },
          });
          ctx?.refresh?.();
          await props.refreshAsync();
          setLoadingRecord(null);
          refreshCM();
          message.success(t('Saved successfully'));
        };

        return isTitleField(record) ? (
          <Tooltip title={t(titlePrompt)} placement="right" overlayInnerStyle={{ textAlign: 'center' }}>
            <Switch
              size="small"
              loading={record.name === loadingRecord?.name}
              checked={record.name === (titleField || 'id')}
              onChange={handleChange}
            />
          </Tooltip>
        ) : null;
      },
    },
    {
      dataIndex: 'actions',
      title: t('Actions'),
      render: function Render(_, record) {
        const overrideProps = {
          type: 'primary',
          currentCollection: name,
        };
        const viewCollectionProps = {
          type: 'primary',
        };

        return (
          <RecordProvider record={record} parent={parentRecord}>
            <Space>
              <OverridingCollectionField {...overrideProps} />
              <ViewCollectionField {...viewCollectionProps} />
            </Space>
          </RecordProvider>
        );
      },
    },
  ];
  return (
    <Table
      rowKey={'name'}
      columns={columns}
      showHeader={false}
      pagination={false}
      dataSource={props.fields.filter((field) => field.interface)}
    />
  );
};

const CollectionFieldsInternal = () => {
  const compile = useCompile();
  const field = useField<Field>();
  const { name, template } = useRecord();
  const {
    data: { database },
  } = useCurrentAppInfo() || {
    data: { database: {} as any },
  };
  const { getInterface, getInheritCollections, getCollection, getTemplate } = useCollectionManager_deprecated();
  const form = useMemo(() => createForm(), []);
  const f = useAttach(form.createArrayField({ ...field.props, basePath: '' }));
  const { t } = useTranslation();
  const collectionResource = useResourceContext();
  const { refreshAsync, data } = useContext(ResourceActionContext);
  const targetTemplate = getTemplate(template);
  const inherits = getInheritCollections(name);

  const columns: TableColumnProps<any>[] = [
    {
      dataIndex: 'title',
      title: t('Field display name'),
      render: (value) => (
        <div
          className={css`
            font-weight: 500;
          `}
        >
          {value}
        </div>
      ),
    },
    {
      dataIndex: 'name',
      title: t('Field name'),
    },
    {
      dataIndex: 'interface',
      title: t('Field interface'),
    },
    {
      dataIndex: 'fieldType',
      title: t('Field type'),
    },
    {
      dataIndex: 'titleField',
      title: t('Title field'),
    },
    {
      dataIndex: 'description',
      title: t('Description'),
    },
    {
      dataIndex: 'actions',
      title: t('Actions'),
    },
  ];
  const fields = data?.data || [];

  const dataSource = [];

  dataSource.push(
    ...inherits
      .map((key) => {
        const collection = getCollection(key);
        if (!collection) {
          return;
        }
        return {
          key,
          title: `${t('Inherited fields')} - ` + compile(collection?.title),
          inherit: true,
          fields: collection?.fields || [],
        };
      })
      .filter(Boolean),
  );

  const deleteProps = useMemo(
    () => ({
      useAction: () => useBulkDestroyActionAndRefreshCM(true),
      title: t('Delete'),
      icon: 'DeleteOutlined',
      disabled: targetTemplate?.forbidDeletion,
      confirm: {
        title: t('Delete record'),
        content: t('Are you sure you want to delete it?'),
      },
    }),
    [t],
  );
  const addProps = { type: 'primary', database };
  const syncProps = { type: 'primary' };
  return (
    <FormContext.Provider value={form}>
      <FieldContext.Provider value={f}>
        <FilterTargetKeyAlert collectionName={name} />
        <Space
          align={'end'}
          className={css`
            justify-content: flex-end;
            display: flex;
            margin-bottom: 16px;
          `}
        >
          <Action {...deleteProps} />
          <SyncFieldsAction {...syncProps} />
          <SyncSQLFieldsAction refreshCMList={refreshAsync} />
          <SchemaComponent
            schema={{
              type: 'object',
              properties: {
                ...targetTemplate?.configureActions,
              },
            }}
          />
          <AddCollectionField {...addProps} />
        </Space>

        {fields.length > 0 && (
          <CurrentFields
            fields={fields}
            collectionResource={collectionResource}
            refreshAsync={refreshAsync}
            type="current"
            showHeader={true}
          />
        )}

        {dataSource.length > 0 && (
          <Table
            rowKey={'key'}
            columns={columns}
            dataSource={dataSource}
            pagination={false}
            showHeader={fields.length === 0}
            className={tableContainer}
            expandable={{
              defaultExpandAllRows: true,
              defaultExpandedRowKeys: dataSource.map((d) => d.key),
              expandedRowRender: (record) => (
                <InheritFields
                  fields={record.fields}
                  collectionResource={collectionResource}
                  refreshAsync={refreshAsync}
                />
              ),
            }}
          />
        )}
      </FieldContext.Provider>
    </FormContext.Provider>
  );
};

export const CollectionFields = () => {
  return (
    <CollectionFieldsProvider>
      <CollectionFieldsInternal />
    </CollectionFieldsProvider>
  );
};
