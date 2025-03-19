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
import { message, Space, Switch, Table, TableColumnProps, Tag, Tooltip } from 'antd';
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

const indentStyle = css`
  .ant-table {
    margin-left: -16px !important;
  }
`;
const tableContainer = css`
  tr {
    display: flex;
  }
  td,
  th {
    flex: 2.3;
    width: 0;
    &:nth-child(5) {
      flex: 1.2;
    }
    &:last-child {
      flex: 1.5;
    }
  }
  .ant-table-selection-column,
  .ant-table-row-expand-icon-cell {
    flex-basis: 50px !important;
    min-width: 50px;
    flex: 0;
  }
`;

const titlePrompt = 'Default title for each record';
const CurrentFields = (props) => {
  const compile = useCompile();
  const { getInterface } = useCollectionManager_deprecated();
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
      render: (value) => <Tag>{compile(getInterface(value)?.title)}</Tag>,
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
      showHeader={false}
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
      className={indentStyle}
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
  const groups = {
    pf: [],
    association: [],
    general: [],
    system: [],
  };

  fields.forEach((field) => {
    if (field.primaryKey || field.isForeignKey) {
      groups.pf.push(field);
    } else if (field.interface) {
      const conf = getInterface(field.interface);
      if (conf?.group === 'systemInfo') {
        groups.system.push(field);
      } else if (conf?.group === 'relation') {
        groups.association.push(field);
      } else {
        groups.general.push(field);
      }
    }
  });

  const dataSource = [
    {
      key: 'pf',
      title: t('PK & FK fields'),
      fields: groups.pf,
    },
    {
      key: 'association',
      title: t('Association fields'),
      fields: groups.association,
    },
    {
      key: 'general',
      title: t('General fields'),
      fields: groups.general,
    },
    {
      key: 'system',
      title: t('System fields'),
      fields: groups.system,
    },
  ];
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
        <Table
          rowKey={'key'}
          columns={columns}
          dataSource={dataSource.filter((d) => d.fields.length)}
          pagination={false}
          className={tableContainer}
          expandable={{
            defaultExpandAllRows: true,
            defaultExpandedRowKeys: dataSource.map((d) => d.key),
            expandedRowRender: (record) =>
              record.inherit ? (
                <InheritFields
                  fields={record.fields}
                  collectionResource={collectionResource}
                  refreshAsync={refreshAsync}
                />
              ) : (
                <CurrentFields
                  fields={record.fields}
                  collectionResource={collectionResource}
                  refreshAsync={refreshAsync}
                  type={record.key}
                />
              ),
          }}
        />
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
