import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { Field, createForm } from '@formily/core';
import { FieldContext, FormContext, useField } from '@formily/react';
import { Button, Checkbox, Space, Table, TableColumnProps, Tag } from 'antd';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useRequest } from '../../api-client';
import { useAsyncData } from '../../async-data-provider';
import { RecordProvider, useRecord } from '../../record-provider';
import { Action, useAttach, useCompile } from '../../schema-component';
import { ResourceActionProvider } from '../ResourceActionProvider';
import { useDeleteButtonDisabled, useDestroyActionAndRefreshCM } from '../action-hooks';
import { useCollectionManager } from '../hooks/useCollectionManager';
import { EditCollectionField } from './EditFieldAction';
import { collection } from './schemas/collectionFields';
const CELL_WIDTH = 200;

const useDefSelectedRowKeys = () => {
  const result = useAsyncData();
  return [result?.state?.selectedRowKeys, (selectedRowKeys) => result?.setState?.({ selectedRowKeys })];
};
const useDef = (options, props) => {
  const { request, dataSource } = props;
  if (request) {
    return useRequest(request(props), options);
  } else {
    return Promise.resolve({
      data: dataSource,
    });
  }
};

const CurrentFields = (props) => {
  const compile = useCompile();
  const { getInterface } = useCollectionManager();
  const { t } = useTranslation();
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
      render: () => <Checkbox />,
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
          disabled: useDeleteButtonDisabled(record),
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
      }}
      className={css`
        .ant-table {
          margin-left: -7px !important;
        }
      `}
    />
  );
};

const InheritFields = (props) => {
  const compile = useCompile();
  const { getInterface } = useCollectionManager();
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
      render: () => <Checkbox />,
    },
    {
      dataIndex: 'actions',
      title: 'Actions',
      width: CELL_WIDTH,
      render: () => {
        return (
          <Space>
            <a>Override</a>
            <a>View</a>
          </Space>
        );
      },
    },
  ];
  return <Table rowKey={'name'} columns={columns} showHeader={false} pagination={false} dataSource={props.fields} />;
};

export const CollectionFields = (props) => {
  const compile = useCompile();
  const field = useField<Field>();
  const { name } = useRecord();
  const { getInterface, getInheritCollections, getCollection, getCurrentCollectionFields } = useCollectionManager();
  const form = useMemo(() => createForm(), []);
  const f = useAttach(form.createArrayField({ ...field.props, basePath: '' }));

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
            <Button icon={<DeleteOutlined />}>Delete</Button>
            <Button type={'primary'} icon={<PlusOutlined />}>
              Add field
            </Button>
          </Space>
          <Table
            rowKey={'key'}
            columns={columns}
            dataSource={dataSource.filter((d) => d.fields.length)}
            pagination={false}
            expandable={{
              defaultExpandAllRows: true,
              expandedRowRender: (record) =>
                record.inherit ? <InheritFields fields={record.fields} /> : <CurrentFields fields={record.fields} />,
            }}
          />
        </FieldContext.Provider>
      </FormContext.Provider>
    </ResourceActionProvider>
  );
};
