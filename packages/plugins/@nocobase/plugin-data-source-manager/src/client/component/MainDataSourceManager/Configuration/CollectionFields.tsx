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
  useFieldInterfaceOptions,
} from '@nocobase/client';
import { message, Select, Space, Switch, Table, TableColumnProps, Tag, Tooltip } from 'antd';
import React, { createContext, useContext, useMemo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { omit } from 'lodash';

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
    flex: 2;
    width: 0;
    min-width: 120px;

    /* Field display name */
    &:nth-child(2) {
      flex: 2.5;
      min-width: 150px;
    }

    /* Field name */
    &:nth-child(3) {
      flex: 2;
      min-width: 120px;
    }

    /* Field interface - 需要更多空间 */
    &:nth-child(4) {
      flex: 2.5;
      min-width: 180px;
    }

    /* Field type */
    &:nth-child(5) {
      flex: 1.8;
      min-width: 120px;
    }

    /* Title field */
    &:nth-child(6) {
      flex: 1.2;
      min-width: 100px;
    }

    /* Description */
    &:nth-child(7) {
      flex: 2;
      min-width: 120px;
    }

    /* Actions */
    &:last-child {
      flex: 1.5;
      min-width: 120px;
    }
  }
  .ant-table-selection-column,
  .ant-table-row-expand-icon-cell {
    flex-basis: 50px !important;
    min-width: 50px;
    flex: 0;
  }
`;

const groupTableContainer = css`
  tr {
    display: flex;
  }
  td,
  th {
    flex: 2;
    width: 0;
    min-width: 120px;

    /* Title column for inherited fields - 需要更多空间显示完整标题 */
    &:nth-child(2) {
      flex: 4;
      min-width: 300px;
      white-space: nowrap;
    }

    /* Field display name */
    &:nth-child(3) {
      flex: 2.5;
      min-width: 150px;
    }

    /* Field name */
    &:nth-child(4) {
      flex: 2;
      min-width: 120px;
    }

    /* Field interface */
    &:nth-child(5) {
      flex: 2.5;
      min-width: 180px;
    }

    /* Field type */
    &:nth-child(6) {
      flex: 1.8;
      min-width: 120px;
    }

    /* Title field */
    &:nth-child(7) {
      flex: 1.2;
      min-width: 100px;
    }

    /* Actions */
    &:last-child {
      flex: 1.5;
      min-width: 120px;
    }
  }
  .ant-table-selection-column,
  .ant-table-row-expand-icon-cell {
    flex-basis: 50px !important;
    min-width: 50px;
    flex: 0;
  }
`;

const inheritFieldsContainer = css`
  tr {
    display: flex;
  }
  td,
  th {
    flex: 2;
    width: 0;
    min-width: 100px;

    /* Field display name */
    &:nth-child(1) {
      flex: 2.5;
      min-width: 150px;
    }

    /* Field name - 减少宽度 */
    &:nth-child(2) {
      flex: 1.5;
      min-width: 100px;
    }

    /* Field interface */
    &:nth-child(3) {
      flex: 2;
      min-width: 150px;
    }

    /* Field type */
    &:nth-child(4) {
      flex: 1.5;
      min-width: 100px;
    }

    /* Title field */
    &:nth-child(5) {
      flex: 1.2;
      min-width: 80px;
    }

    /* Description */
    &:nth-child(6) {
      flex: 2;
      min-width: 120px;
    }

    /* Actions */
    &:last-child {
      flex: 1.8;
      min-width: 140px;
    }
  }
`;

const titlePrompt = 'Default title for each record';

const getInterfaceOptions = (data, type) => {
  const interfaceOptions = [];
  data.forEach((item) => {
    const options = item.children.filter((h) => h?.availableTypes?.includes(type));
    interfaceOptions.push({
      label: item.label,
      key: item.key,
      children: options,
    });
  });
  return interfaceOptions.filter((v) => {
    if (type === 'sort') {
      return v.key === 'advanced';
    }
    return v.children.length > 0;
  });
};

const isValueInOptions = (value, options) => {
  return options?.some((option) => option.children?.some?.((child) => child.name === value));
};

const FieldInterfaceRenderer = ({ value, record, updateFieldHandler }) => {
  const compile = useCompile();
  const { getInterface } = useCollectionManager_deprecated();
  const initOptions = useFieldInterfaceOptions();
  const [selectValue, setSelectValue] = useState(value);
  const [options, setOptions] = useState([]);
  const targetType = record.type;

  useEffect(() => {
    if (record?.possibleTypes || targetType) {
      const newOptions = getInterfaceOptions(initOptions, targetType);
      setOptions(newOptions);
    }
  }, [targetType, initOptions]);

  useEffect(() => {
    if (options.length === 1 && options[0]?.children?.length === 1) {
      const targetValue = options[0]?.children?.[0]?.name;
      if (targetValue !== selectValue) {
        const interfaceConfig = getInterface(targetValue);
        setSelectValue(targetValue);
        updateFieldHandler(record, {
          interface: targetValue,
          uiSchema: { title: record?.uiSchema?.title, ...interfaceConfig?.default?.uiSchema },
        });
      }
    } else if (selectValue && !isValueInOptions(selectValue, options)) {
      const targetValue = options[0]?.children?.[0]?.name;
      if (targetValue) {
        const interfaceConfig = getInterface(targetValue);
        setSelectValue(targetValue);
        updateFieldHandler(record, {
          interface: targetValue,
          uiSchema: { title: record?.uiSchema?.title, ...interfaceConfig?.default?.uiSchema },
        });
      }
    }
  }, [options, selectValue]);

  if (['oho', 'obo', 'o2m', 'm2o', 'm2m'].includes(record.interface)) {
    return (
      <Tag>
        {compile(initOptions.find((h) => h.key === 'relation')?.children?.find((v) => v.name === value)?.label)}
      </Tag>
    );
  }

  if (!options.length || options.every((group) => !group.children.length)) {
    return <Tag>{compile(getInterface(value)?.title)}</Tag>;
  }

  return (
    <Select
      aria-label={`field-interface-${record?.type}`}
      value={selectValue}
      style={{ width: '100%' }}
      popupMatchSelectWidth={false}
      onChange={async (newValue) => {
        const interfaceConfig = getInterface(newValue);
        setSelectValue(newValue);
        await updateFieldHandler(record, {
          interface: newValue,
          uiSchema: { title: record?.uiSchema?.title, ...interfaceConfig?.default?.uiSchema },
        });
      }}
    >
      {options.map((group) => (
        <Select.OptGroup key={group.key} label={compile(group.label)}>
          {group.children.map((item) => (
            <Select.Option key={item.name} value={item.name}>
              {compile(item.label)}
            </Select.Option>
          ))}
        </Select.OptGroup>
      ))}
    </Select>
  );
};

const FieldTypeRenderer = ({ value, record, updateFieldHandler }) => {
  const item = omit(record, ['__parent', '__collectionName']);
  return !item?.possibleTypes ? (
    <Tag>{value}</Tag>
  ) : (
    <Select
      aria-label={`field-type-${value}`}
      defaultValue={value}
      popupMatchSelectWidth={false}
      style={{ width: '100%' }}
      options={
        item?.possibleTypes.map((v) => {
          return { label: v, value: v };
        }) || []
      }
      onChange={async (newValue) => {
        await updateFieldHandler(record, { type: newValue });
      }}
    />
  );
};

const CurrentFields = (props) => {
  const compile = useCompile();
  const { getInterface } = useCollectionManager_deprecated();
  const { t } = useTranslation();
  const { setState } = useResourceActionContext();
  const { targetKey, resource } = props.collectionResource || {};
  const parentRecordData = useRecord();
  const [loadingRecord, setLoadingRecord] = React.useState<any>(null);
  const { refreshCM, isTitleField, getTemplate } = useCollectionManager_deprecated();
  const { [targetKey]: filterByTk, titleField, template } = parentRecordData;
  const targetTemplate = getTemplate(template);
  const api = useAPIClient();
  const ctx = useContext(CollectionListContext);
  const updateFieldHandler = async (record, values) => {
    try {
      await resource.update({
        filterByTk: record.name,
        values: {
          ...values,
          collectionName: record.collectionName,
        },
      });
      ctx?.refresh?.();
      await props.refreshAsync();
      refreshCM();
      message.success(t('Saved successfully'));
    } catch (error) {
      console.error('Failed to update field type:', error);
      message.error(t('Save failed'));
    }
  };
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
      render: (value, record) => (
        <FieldInterfaceRenderer value={value} record={record} updateFieldHandler={updateFieldHandler} />
      ),
    },
    {
      dataIndex: 'type',
      title: t('Field type'),
      render: (value, record) => (
        <FieldTypeRenderer value={value} record={record} updateFieldHandler={updateFieldHandler} />
      ),
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
      title: t('Description'),
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
      showHeader={true}
      pagination={false}
      dataSource={props.fields}
      className={tableContainer}
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
      dataIndex: 'type',
      title: t('Field type'),
      render: (value, record) => <Tag>{value}</Tag>,
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
      dataIndex: 'description',
      title: t('Description'),
      render: (value) => <Input.ReadPretty value={value} ellipsis={true} />,
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
      className={inheritFieldsContainer}
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
            white-space: nowrap;
            min-width: 300px;
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
      dataIndex: 'type',
      title: t('Field type'),
    },
    {
      dataIndex: 'titleField',
      title: t('Title field'),
    },
    {
      dataIndex: 'actions',
      title: t('Actions'),
    },
  ];
  const fields = data?.data || [];
  const allCurrentFields = fields.filter((field) => field.interface || field.primaryKey || field.isForeignKey);

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
        {allCurrentFields.length > 0 && (
          <div>
            <CurrentFields
              fields={allCurrentFields}
              collectionResource={collectionResource}
              refreshAsync={refreshAsync}
              type="all"
            />
          </div>
        )}
        {dataSource.filter((d) => d.fields.length).length > 0 && (
          <Table
            rowKey={'key'}
            columns={columns}
            dataSource={dataSource.filter((d) => d.fields.length)}
            pagination={false}
            showHeader={false}
            className={groupTableContainer}
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
