import { css } from '@emotion/css';
import { Field, createForm } from '@formily/core';
import { FieldContext, FormContext, useField } from '@formily/react';
import { Space, Switch, Table, TableColumnProps, Tag, Tooltip } from 'antd';
import React, { useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { RecordProvider, useRecord } from '../../record-provider';
import { Action, useAttach, useCompile } from '../../schema-component';
import {
  ResourceActionContext,
  ResourceActionProvider,
  useResourceActionContext,
  useResourceContext,
} from '../ResourceActionProvider';
import {
  isDeleteButtonDisabled,
  useBulkDestroyActionAndRefreshCM,
  useDestroyActionAndRefreshCM,
} from '../action-hooks';
import { useCollectionManager } from '../hooks/useCollectionManager';
import { AddCollectionField } from './AddFieldAction';
import { EditCollectionField } from './EditFieldAction';
import { OverridingCollectionField } from './OverridingCollectionField';
import { SyncFieldsAction } from './SyncFieldsAction';
import { ViewCollectionField } from './ViewInheritedField';
import { collection } from './schemas/collectionFields';
const CELL_WIDTH = 200;

const indentStyle = css`
  .ant-table {
    margin-left: -7px !important;
  }
`;
const rowStyle = css`
  .ant-table-cell {
    background-color: white;
  }
`;

const titlePrompt = 'Default title for each record';
// 只有下面类型的字段才可以设置为标题字段
const expectTypes = ['string', 'integer', 'bigInt', 'float', 'double', 'decimal', 'date', 'dateonly', 'time'];
const excludeInterfaces = ['icon'];

const CurrentFields = (props) => {
  const compile = useCompile();
  const { getInterface } = useCollectionManager();
  const { t } = useTranslation();
  const { setState } = useResourceActionContext();
  const { resource, targetKey } = props.collectionResource || {};
  const { [targetKey]: filterByTk, titleField } = useRecord();
  const [loadingRecord, setLoadingRecord] = React.useState<any>(null);

  const columns: TableColumnProps<any>[] = [
    {
      dataIndex: ['uiSchema', 'title'],
      title: 'Field display name',
      render: (value) => <div style={{ marginLeft: 7 }}>{compile(value)}</div>,
    },
    {
      dataIndex: 'name',
      title: 'Field name',
      width: CELL_WIDTH + 20,
    },
    {
      dataIndex: 'interface',
      title: 'Field interface',
      width: CELL_WIDTH,
      render: (value) => <Tag>{compile(getInterface(value)?.title)}</Tag>,
    },
    {
      dataIndex: 'titleField',
      title: 'Title field',
      width: CELL_WIDTH,
      render: function Render(_, record) {
        const handleChange = (checked) => {
          setLoadingRecord(record);
          resource
            .update({ filterByTk, values: { titleField: checked ? record.name : 'id' } })
            .then(async () => {
              await props.refreshAsync();
              setLoadingRecord(null);
            })
            .catch((err) => {
              setLoadingRecord(null);
              console.error(err);
            });
        };

        return expectTypes.includes(record.type) && !excludeInterfaces.includes(record.interface) ? (
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
      title: 'Actions',
      width: CELL_WIDTH,
      render: (_, record) => {
        const deleteProps = {
          confirm: {
            title: t('Delete record'),
            content: t('Are you sure you want to delete it?'),
          },
          useAction: useDestroyActionAndRefreshCM,
          disabled: isDeleteButtonDisabled(record),
          title: t('Delete'),
        };

        return (
          <RecordProvider record={record}>
            <Space>
              <EditCollectionField type="primary" />
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
        onChange: (selectedRowKeys) => {
          setState((state) => {
            const result = [...(state.selectedRowKeys || []), ...selectedRowKeys];
            return {
              ...state,
              selectedRowKeys: result,
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
  const { getInterface } = useCollectionManager();
  const { resource, targetKey } = props.collectionResource || {};
  const { [targetKey]: filterByTk, titleField, name } = useRecord();
  const [loadingRecord, setLoadingRecord] = React.useState(null);
  const { t } = useTranslation();

  const columns: TableColumnProps<any>[] = [
    {
      dataIndex: ['uiSchema', 'title'],
      title: 'Field display name',
      render: (value) => <div style={{ marginLeft: 1 }}>{compile(value)}</div>,
    },
    {
      dataIndex: 'name',
      title: 'Field name',
      width: CELL_WIDTH + 20,
    },
    {
      dataIndex: 'interface',
      title: 'Field interface',
      width: CELL_WIDTH,
      render: (value) => <Tag>{compile(getInterface(value)?.title)}</Tag>,
    },
    {
      dataIndex: 'titleField',
      title: 'Title field',
      width: CELL_WIDTH,
      render(_, record) {
        const handleChange = (checked) => {
          setLoadingRecord(record);
          resource
            .update({ filterByTk, values: { titleField: checked ? record.name : 'id' } })
            .then(async () => {
              await props.refreshAsync();
              setLoadingRecord(null);
            })
            .catch((err) => {
              setLoadingRecord(null);
              console.error(err);
            });
        };

        return expectTypes.includes(record.type) && !excludeInterfaces.includes(record.interface) ? (
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
      title: 'Actions',
      width: CELL_WIDTH,
      render: function Render(_, record) {
        const overrideProps = {
          type: 'primary',
          currentCollection: name,
        };
        const viewCollectionProps = {
          type: 'primary',
        };

        return (
          <RecordProvider record={record}>
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

export const CollectionFields = (props) => {
  const compile = useCompile();
  const field = useField<Field>();
  const { name } = useRecord();
  const { getInterface, getInheritCollections, getCollection, getCurrentCollectionFields } = useCollectionManager();
  const form = useMemo(() => createForm(), []);
  const f = useAttach(form.createArrayField({ ...field.props, basePath: '' }));
  const { t } = useTranslation();
  const collectionResource = useResourceContext();
  const { refreshAsync } = useContext(ResourceActionContext);

  const inherits = getInheritCollections(name);

  const columns: TableColumnProps<any>[] = [
    {
      dataIndex: 'title',
      title: 'Field display name',
      render: (value) => (
        <div
          className={css`
            font-weight: 500;
            white-space: nowrap;
            width: 100px;
          `}
        >
          {value}
        </div>
      ),
      // width: CELL_WIDTH,
    },
    {
      dataIndex: 'name',
      title: 'Field name',
      width: CELL_WIDTH + 20,
    },
    {
      dataIndex: 'interface',
      title: 'Field interface',
      width: CELL_WIDTH,
    },
    {
      dataIndex: 'titleField',
      title: 'Title field',
      width: CELL_WIDTH,
    },
    {
      dataIndex: 'actions',
      title: 'Actions',
      width: CELL_WIDTH,
    },
  ];

  const fields = getCurrentCollectionFields(name);

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
      if (conf.group === 'systemInfo') {
        groups.system.push(field);
      } else if (['m2m', 'm2o', 'o2b', 'o2m', 'linkTo'].includes(field.interface)) {
        groups.association.push(field);
      } else {
        groups.general.push(field);
      }
    }
  });

  const dataSource = [
    {
      key: 'pf',
      title: 'PK & FK fields',
      fields: groups.pf,
    },
    {
      key: 'association',
      title: 'Association fields',
      fields: groups.association,
    },
    {
      key: 'general',
      title: 'General fields',
      fields: groups.general,
    },
    {
      key: 'system',
      title: 'System fields',
      fields: groups.system,
    },
  ];

  dataSource.push(
    ...inherits.map((key) => {
      const collection = getCollection(key);
      return {
        key,
        title: 'Inherited fields - ' + compile(collection.title),
        inherit: true,
        fields: collection.fields,
      };
    }),
  );

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

  const deleteProps = useMemo(
    () => ({
      useAction: useBulkDestroyActionAndRefreshCM,
      title: t('Delete'),
      icon: 'DeleteOutlined',
      confirm: {
        title: t('Delete record'),
        content: t('Are you sure you want to delete it?'),
      },
    }),
    [t],
  );
  const addProps = { type: 'primary' };
  const syncProps = { type: 'primary' };

  return (
    <ResourceActionProvider {...resourceActionProps}>
      <FormContext.Provider value={form}>
        <FieldContext.Provider value={f}>
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
            <AddCollectionField {...addProps} />
          </Space>
          <Table
            rowKey={'key'}
            columns={columns}
            dataSource={dataSource.filter((d) => d.fields.length)}
            pagination={false}
            expandable={{
              defaultExpandAllRows: true,
              expandedRowClassName: () => rowStyle,
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
                  />
                ),
            }}
          />
        </FieldContext.Provider>
      </FormContext.Provider>
    </ResourceActionProvider>
  );
};
