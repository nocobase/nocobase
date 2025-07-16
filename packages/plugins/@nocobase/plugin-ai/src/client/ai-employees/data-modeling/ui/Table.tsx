/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Table as AntdTable, Checkbox, Tag, Select, Input, Form, GetRef, TableProps, theme } from 'antd';
import type { TableColumnsType } from 'antd';
import { useT } from '../../../locale';
import { useApp, useToken } from '@nocobase/client';
import { Schema } from '@formily/react';
import { cx, css } from '@emotion/css';
import { useFieldInterfaceOptions } from './useFieldInterfaceOptions';
import { ToolCall } from '../../types';
import { CollectionDataType, FieldDataType } from '../types';

const editableRowClassName = cx(
  'editable-row',
  css`
    .editable-cell {
      position: relative;
    }

    .editable-cell-value-wrap {
      padding: 5px 12px;
      cursor: pointer;
    }

    &:hover .editable-cell-value-wrap {
      border: 1px solid #d9d9d9;
      border-radius: 4px;
      padding: 4px 11px;
    }

    [data-theme='dark'] &:hover .editable-cell-value-wrap {
      border: 1px solid #434343;
    }
  `,
);

type FormInstance<T> = GetRef<typeof Form<T>>;

type FieldColumnTypes = Exclude<TableProps<FieldDataType>['columns'], undefined>;

type CollectionColumnTypes = Exclude<TableProps<CollectionDataType>['columns'], undefined>;

const EditableContext = React.createContext<FormInstance<any> | null>(null);

interface EditableRowProps {
  index: number;
}

interface CollectionItem {
  title: string;
  name: string;
}

interface FieldItem {
  title: string;
  name: string;
  interface?: string;
}

const EditableRow: React.FC<EditableRowProps> = ({ index, ...props }) => {
  const [form] = Form.useForm();
  return (
    <Form form={form} component={false}>
      <EditableContext.Provider value={form}>
        <tr {...props} />
      </EditableContext.Provider>
    </Form>
  );
};

interface EditableCellProps {
  collectionIndex: number;
  title: React.ReactNode;
  editable: boolean;
  EditComponent?: (
    record: (CollectionItem | FieldItem) & {
      save: () => Promise<void>;
      ref: React.MutableRefObject<any>;
    },
  ) => React.ReactNode;
  ReadComponent?: (record: CollectionItem | FieldItem) => React.ReactNode;
  dataIndex: keyof CollectionItem | keyof FieldItem;
  record: CollectionItem | FieldItem;
  handleSave: (collectionIndex: number, record: CollectionItem | FieldItem) => void;
}

const EditableCell: React.FC<React.PropsWithChildren<EditableCellProps>> = ({
  title,
  editable,
  EditComponent,
  ReadComponent,
  children,
  dataIndex,
  record,
  collectionIndex,
  handleSave,
  ...restProps
}) => {
  const [editing, setEditing] = useState(false);
  const ref = useRef(null);
  const form = useContext(EditableContext);

  useEffect(() => {
    if (editing) {
      ref.current?.focus();
    }
  }, [editing]);

  const toggleEdit = () => {
    setEditing(!editing);
    form.setFieldsValue({ [dataIndex]: record[dataIndex] });
  };

  const save = async () => {
    try {
      const values = await form.validateFields();

      toggleEdit();
      handleSave({ ...record, ...values });
    } catch (errInfo) {
      console.log('Save failed:', errInfo);
    }
  };

  let childNode = ReadComponent?.(record) || children;

  if (editable) {
    const render = EditComponent?.({ ...record, save, ref }) || <Input ref={ref} onPressEnter={save} onBlur={save} />;
    childNode = editing ? (
      <Form.Item style={{ margin: 0 }} name={dataIndex} rules={[{ required: true, message: `${title} is required.` }]}>
        {render}
      </Form.Item>
    ) : (
      <div className="editable-cell-value-wrap" style={{ paddingInlineEnd: 24 }} onClick={toggleEdit}>
        {childNode}
      </div>
    );
  }

  return <td {...restProps}>{childNode}</td>;
};

const useColumns = (
  updateCollectionRecord: (collectionIndex: number, collection: CollectionDataType) => Promise<void>,
) => {
  const t = useT();
  const columns: (CollectionColumnTypes[number] & { editable?: boolean; dataIndex?: string })[] = [
    {
      title: t('Collection display name'),
      dataIndex: 'title',
      key: 'title',
      width: 200,
      editable: true,
    },
    {
      title: t('Collection name'),
      dataIndex: 'name',
      key: 'name',
      width: 150,
      editable: true,
    },
    {
      title: t('Collection template'),
      dataIndex: 'template',
      key: 'template',
      width: 150,
      render: (value) => {
        if (!value) {
          return null;
        }
        const template = value.charAt(0).toUpperCase() + value.slice(1);
        return <Tag>{t(`${template} collection`)}</Tag>;
      },
    },
    {
      title: t('Preset fields'),
      key: 'preset',
      width: 300,
      render: (_, record) => {
        const value = [];
        if (record.autoGenId !== false) {
          value.push('id');
        }
        if (record.createdAt !== false) {
          value.push('createdAt');
        }
        if (record.updatedAt !== false) {
          value.push('updatedAt');
        }
        if (record.createdBy) {
          value.push('createdBy');
        }
        if (record.updatedBy) {
          value.push('updatedBy');
        }
        return (
          <Checkbox.Group
            options={[
              {
                label: 'ID',
                value: 'id',
              },
              {
                label: t('Created at'),
                value: 'createdAt',
              },
              {
                label: t('Last Updated at'),
                value: 'updatedAt',
              },
              {
                label: t('Created by'),
                value: 'createdBy',
              },
              {
                label: t('Last updated by'),
                value: 'updatedBy',
              },
            ]}
            defaultValue={value}
            disabled
          />
        );
      },
    },
    {
      title: t('Description'),
      dataIndex: 'description',
      key: 'description',
      width: 350,
    },
  ];
  return columns.map((col) => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: (record: CollectionDataType, collectionIndex: number) => ({
        record,
        editable: col.editable,
        dataIndex: col.dataIndex,
        title: col.title,
        handleSave: (record: CollectionDataType) => updateCollectionRecord(collectionIndex, record),
      }),
    };
  });
};

const useExpandColumns = (
  collectionIndex: number,
  updateFieldRecord: (collectionIndex: number, fieldIndex: number, field: FieldDataType) => Promise<void>,
) => {
  const t = useT();
  const app = useApp();
  const fim = app.dataSourceManager.collectionFieldInterfaceManager;
  const columns: (FieldColumnTypes[number] & {
    editable?: boolean;
    dataIndex?: string;
    EditComponent?: (
      record: FieldItem & {
        save: () => Promise<void>;
        ref: React.MutableRefObject<any>;
      },
    ) => React.ReactNode;
    ReadComponent?: (record: FieldItem) => React.ReactNode;
  })[] = [
    AntdTable.EXPAND_COLUMN,
    {
      title: t('Field display name'),
      dataIndex: 'title',
      width: 200,
      key: 'title',
      editable: true,
    },
    {
      title: t('Field name'),
      dataIndex: 'name',
      key: 'name',
      width: 150,
      editable: true,
    },
    {
      title: t('Field interface'),
      width: 200,
      dataIndex: 'interface',
      key: 'interface',
      editable: true,
      EditComponent: ({ interface: value, save, ref }) => {
        const interfaceOptions = useFieldInterfaceOptions();
        const fieldInterface = fim.getFieldInterface(value);
        return (
          <Select
            ref={ref}
            options={interfaceOptions}
            defaultValue={fieldInterface ? Schema.compile(fieldInterface.title, { t }) : value}
            onBlur={save}
          />
        );
      },
      ReadComponent: ({ interface: value }) => {
        if (!value) {
          return null;
        }
        const fieldInterface = fim.getFieldInterface(value);
        return <Tag>{fieldInterface ? Schema.compile(fieldInterface.title, { t }) : value}</Tag>;
      },
    },
    {
      title: t('Description'),
      dataIndex: 'description',
      key: 'description',
      width: 350,
    },
  ];
  return columns.map((col) => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: (record: FieldDataType, fieldIndex: number) => ({
        record,
        editable: col.editable,
        dataIndex: col.dataIndex,
        title: col.title,
        EditComponent: col.EditComponent,
        ReadComponent: col.ReadComponent,
        handleSave: (record: FieldDataType) => updateFieldRecord(collectionIndex, fieldIndex, record),
      }),
    };
  });
};

const ExpandedFieldRowRender: React.FC<{
  record: FieldDataType;
}> = ({ record }) => {
  const { token } = theme.useToken();
  return (
    <>
      {record.enum && (
        <div>
          <span
            style={{
              color: token.colorTextSecondary,
              marginRight: '8px',
              marginLeft: '48px',
            }}
          >
            Enumurations:
          </span>
          {record.enum.map((item) => (
            <Tag key={item.value}>
              {item.label} ({item.value})
            </Tag>
          ))}
        </div>
      )}
      {record.target && (
        <div>
          <span
            style={{
              color: '#999',
              marginRight: '8px',
              marginLeft: '48px',
            }}
          >
            Target:
          </span>
          <span>{record.target}</span>
        </div>
      )}
      {record.targetKey && (
        <div>
          <span
            style={{
              color: '#999',
              marginRight: '8px',
              marginLeft: '48px',
            }}
          >
            TargetKey:
          </span>
          <span>{record.targetKey}</span>
        </div>
      )}
      {record.sourceKey && (
        <div>
          <span
            style={{
              color: '#999',
              marginRight: '8px',
              marginLeft: '48px',
            }}
          >
            SourceKey:
          </span>
          <span>{record.sourceKey}</span>
        </div>
      )}
      {record.foreignKey && (
        <div>
          <span
            style={{
              color: '#999',
              marginRight: '8px',
              marginLeft: '48px',
            }}
          >
            ForeignKey:
          </span>
          <span>{record.foreignKey}</span>
        </div>
      )}
      {record.otherKey && (
        <div>
          <span
            style={{
              color: '#999',
              marginRight: '8px',
              marginLeft: '48px',
            }}
          >
            OtherKey:
          </span>
          <span>{record.otherKey}</span>
        </div>
      )}
    </>
  );
};

const ExpandedCollectionRowRender: React.FC<{
  record: CollectionDataType;
  collectionIndex: number;
  updateFieldRecord: (collectionIndex: number, fieldIndex: number, field: FieldDataType) => Promise<void>;
}> = ({ record, collectionIndex, updateFieldRecord }) => {
  const expandColumns = useExpandColumns(collectionIndex, updateFieldRecord);

  return (
    <AntdTable<FieldDataType>
      rowKey="name"
      rowClassName={editableRowClassName}
      columns={expandColumns as FieldColumnTypes}
      components={{
        body: {
          row: EditableRow,
          cell: EditableCell,
        },
      }}
      dataSource={record.fields}
      pagination={false}
      expandable={{
        rowExpandable: (record) => record.enum?.length > 0 || ['m2m', 'm2o', 'o2m', 'o2o'].includes(record.interface),
        expandedRowRender: (record) => <ExpandedFieldRowRender record={record} />,
      }}
    />
  );
};

export const Table: React.FC<{
  collections: any[];
  updateCollectionRecord: (collectionIndex: number, collection: CollectionDataType) => Promise<void>;
  updateFieldRecord: (collectionIndex: number, fieldIndex: number, field: FieldDataType) => Promise<void>;
}> = ({ collections, updateCollectionRecord, updateFieldRecord }) => {
  const columns = useColumns(updateCollectionRecord);

  return (
    <AntdTable<CollectionDataType>
      scroll={{
        y: '55vh',
      }}
      style={{
        height: '65vh',
      }}
      rowKey="name"
      rowClassName={editableRowClassName}
      columns={columns as CollectionColumnTypes}
      dataSource={collections}
      components={{
        body: {
          row: EditableRow,
          cell: EditableCell,
        },
      }}
      expandable={{
        expandedRowRender: (record, collectionIndex) => (
          <ExpandedCollectionRowRender
            record={record}
            collectionIndex={collectionIndex}
            updateFieldRecord={updateFieldRecord}
          />
        ),
        rowExpandable: (record) => record.fields && record.fields.length > 0,
      }}
    />
  );
};
