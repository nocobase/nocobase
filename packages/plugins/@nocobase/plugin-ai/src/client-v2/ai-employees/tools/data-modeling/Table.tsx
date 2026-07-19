/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Checkbox, Form, Input, Select, Table as AntdTable, Tag, theme, type GetRef, type TableProps } from 'antd';
import { css, cx } from '@emotion/css';
import { useApp } from '@nocobase/client-v2';
import { useRequest } from 'ahooks';
import { useT } from '../../../locale';
import { compileLegacyTemplate, compileLegacyTemplateText } from './legacy-template';
import type { CollectionDataType, FieldDataType } from './types';
import {
  useFieldInterfaceOptions,
  type FieldInterfaceOption,
  type FieldInterfaceOptionGroup,
} from './useFieldInterfaceOptions';

type FormInstance<T> = GetRef<typeof Form<T>>;
type FieldColumnTypes = Exclude<TableProps<FieldDataType>['columns'], undefined>;
type CollectionColumnTypes = Exclude<TableProps<CollectionDataType>['columns'], undefined>;

type CollectionItem = Pick<CollectionDataType, 'title' | 'name'>;
type FieldItem = Pick<FieldDataType, 'title' | 'name' | 'interface'>;
type EditableRecord = CollectionItem | FieldItem;

const EditableContext = React.createContext<FormInstance<EditableRecord> | null>(null);

function useEditableRowClassName() {
  const { token } = theme.useToken();
  return useMemo(
    () =>
      cx(
        'editable-row',
        css`
          .editable-cell {
            position: relative;
          }

          .editable-cell-value-wrap {
            padding: ${token.paddingXXS}px ${token.paddingSM}px;
            cursor: pointer;
          }

          &:hover .editable-cell-value-wrap {
            border: ${token.lineWidth}px ${token.lineType} ${token.colorBorder};
            border-radius: ${token.borderRadius}px;
            padding: ${Math.max(token.paddingXXS - token.lineWidth, 0)}px
              ${Math.max(token.paddingSM - token.lineWidth, 0)}px;
          }
        `,
      ),
    [token],
  );
}

const EditableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = (props) => {
  const [form] = Form.useForm<EditableRecord>();
  return (
    <Form form={form} component={false}>
      <EditableContext.Provider value={form}>
        <tr {...props} />
      </EditableContext.Provider>
    </Form>
  );
};

interface EditableCellProps {
  title: React.ReactNode;
  editable?: boolean;
  EditComponent?: React.FC<{
    record: FieldItem;
    save: () => Promise<void>;
    focusRef: React.MutableRefObject<{ focus?: () => void } | null>;
  }>;
  ReadComponent?: (record: FieldItem) => React.ReactNode;
  dataIndex: keyof EditableRecord;
  record: EditableRecord;
  handleSave: (record: EditableRecord) => void;
}

const EditableCell: React.FC<React.PropsWithChildren<EditableCellProps>> = ({
  title,
  editable,
  EditComponent,
  ReadComponent,
  children,
  dataIndex,
  record,
  handleSave,
  ...restProps
}) => {
  const [editing, setEditing] = useState(false);
  const focusRef = useRef<{ focus?: () => void } | null>(null);
  const form = useContext(EditableContext);

  useEffect(() => {
    if (editing) {
      focusRef.current?.focus?.();
    }
  }, [editing]);

  const toggleEdit = () => {
    setEditing(!editing);
    form?.setFieldsValue({ [dataIndex]: record[dataIndex] });
  };

  const save = async () => {
    if (!form) {
      return;
    }
    try {
      const values = await form.validateFields();
      toggleEdit();
      handleSave({ ...record, ...values });
    } catch (error) {
      console.log('Save failed:', error);
    }
  };

  let childNode = ReadComponent?.(record as FieldItem) || children;

  if (editable) {
    const editor = EditComponent ? (
      <EditComponent record={record as FieldItem} save={save} focusRef={focusRef} />
    ) : (
      <Input ref={focusRef as React.RefObject<GetRef<typeof Input>>} onPressEnter={save} onBlur={save} />
    );
    childNode = editing ? (
      <Form.Item style={{ margin: 0 }} name={dataIndex} rules={[{ required: true, message: `${title} is required.` }]}>
        {editor}
      </Form.Item>
    ) : (
      <div className="editable-cell-value-wrap" onClick={toggleEdit}>
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
  const { token } = theme.useToken();
  const columnsWidth = {
    collectionTitle: token.controlHeightLG * 5,
    collectionName: token.controlHeightLG * 4,
    template: token.controlHeightLG * 4,
    preset: token.controlHeightLG * 8,
    description: token.controlHeightLG * 9,
  };
  const columns: (CollectionColumnTypes[number] & { editable?: boolean; dataIndex?: keyof CollectionDataType })[] = [
    {
      title: t('Collection display name'),
      dataIndex: 'title',
      key: 'title',
      width: columnsWidth.collectionTitle,
      editable: true,
    },
    {
      title: t('Collection name'),
      dataIndex: 'name',
      key: 'name',
      width: columnsWidth.collectionName,
      editable: true,
    },
    {
      title: t('Collection template'),
      dataIndex: 'template',
      key: 'template',
      width: columnsWidth.template,
      render: (value: unknown) => {
        if (typeof value !== 'string' || !value) {
          return null;
        }
        const template = value.charAt(0).toUpperCase() + value.slice(1);
        return <Tag>{t(`${template} collection`)}</Tag>;
      },
    },
    {
      title: t('Preset fields'),
      key: 'preset',
      width: columnsWidth.preset,
      render: (_value: unknown, record: CollectionDataType) => {
        const value: string[] = [];
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
              { label: 'ID', value: 'id' },
              { label: t('Created at'), value: 'createdAt' },
              { label: t('Last updated at'), value: 'updatedAt' },
              { label: t('Created by'), value: 'createdBy' },
              { label: t('Last updated by'), value: 'updatedBy' },
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
      width: columnsWidth.description,
    },
  ];

  return columns.map((column) => {
    if (!column.editable) {
      return column;
    }
    return {
      ...column,
      onCell: (record: CollectionDataType, collectionIndex: number) => ({
        record,
        editable: column.editable,
        dataIndex: column.dataIndex,
        title: column.title,
        handleSave: (nextRecord: CollectionDataType) => updateCollectionRecord(collectionIndex, nextRecord),
      }),
    };
  });
};

const FieldInterfaceSelect: React.FC<{
  record: FieldItem;
  save: () => Promise<void>;
  focusRef: React.MutableRefObject<{ focus?: () => void } | null>;
  collection: CollectionDataType;
}> = ({ record, save, focusRef, collection }) => {
  const t = useT();
  const app = useApp();
  const result = useRequest<{ data?: { database?: { dialect?: string } } }, []>(
    () => app.apiClient.request({ url: 'app:getInfo' }),
    { cacheKey: '@nocobase/plugin-ai/app-info' },
  );
  const interfaceOptions = useFieldInterfaceOptions();
  const optionArr = useMemo(() => {
    return interfaceOptions
      .map((group) => ({
        ...group,
        options: group.options.filter((option) => isFieldInterfaceAvailable(option, collection, result.data)),
      }))
      .filter((group) => group.options.length > 0)
      .map((group) => ({
        ...group,
        label: group.label,
        options: group.options.map((option) => ({
          ...option,
          label: option.label,
          value: option.value,
        })),
      }));
  }, [collection, interfaceOptions, result.data]);

  const manager = app.dataSourceManager.collectionFieldInterfaceManager;
  const fieldInterface = record.interface ? manager?.getFieldInterface(record.interface) : undefined;
  const defaultValue = fieldInterface
    ? compileLegacyTemplateText(fieldInterface.title || record.interface, t)
    : record.interface;

  return (
    <Select
      ref={focusRef as React.RefObject<GetRef<typeof Select>>}
      options={optionArr}
      defaultValue={defaultValue}
      onBlur={save}
    />
  );
};

const isFieldInterfaceAvailable = (
  option: FieldInterfaceOption,
  collection: CollectionDataType,
  appInfo?: { data?: { database?: { dialect?: string } } },
) => {
  if (option.hidden) {
    return false;
  }
  if (option.value === 'tableoid') {
    return appInfo?.data?.database?.dialect === 'postgres';
  }
  if (typeof option.value === 'string' && typeof collection[option.value] === 'boolean') {
    return Boolean(collection[option.value]);
  }
  return !['o2o', 'subTable', 'linkTo'].includes(option.name || '');
};

const useExpandColumns = (
  collection: CollectionDataType,
  collectionIndex: number,
  updateFieldRecord: (collectionIndex: number, fieldIndex: number, field: FieldDataType) => Promise<void>,
) => {
  const t = useT();
  const app = useApp();
  const { token } = theme.useToken();
  const columnsWidth = {
    fieldTitle: token.controlHeightLG * 5,
    fieldName: token.controlHeightLG * 4,
    fieldInterface: token.controlHeightLG * 5,
    description: token.controlHeightLG * 9,
  };
  const columns: (FieldColumnTypes[number] & {
    editable?: boolean;
    dataIndex?: keyof FieldDataType;
    EditComponent?: EditableCellProps['EditComponent'];
    ReadComponent?: EditableCellProps['ReadComponent'];
  })[] = [
    AntdTable.EXPAND_COLUMN,
    {
      title: t('Field display name'),
      dataIndex: 'title',
      width: columnsWidth.fieldTitle,
      key: 'title',
      editable: true,
    },
    {
      title: t('Field name'),
      dataIndex: 'name',
      key: 'name',
      width: columnsWidth.fieldName,
      editable: true,
    },
    {
      title: t('Field interface'),
      width: columnsWidth.fieldInterface,
      dataIndex: 'interface',
      key: 'interface',
      editable: true,
      EditComponent: (props) => <FieldInterfaceSelect {...props} collection={collection} />,
      ReadComponent: ({ interface: value }) => {
        if (!value) {
          return null;
        }
        const fieldInterface = app.dataSourceManager.collectionFieldInterfaceManager?.getFieldInterface(value);
        return <Tag>{fieldInterface ? compileLegacyTemplate(fieldInterface.title, t) : value}</Tag>;
      },
    },
    {
      title: t('Description'),
      dataIndex: 'description',
      key: 'description',
      width: columnsWidth.description,
    },
  ];

  return columns.map((column) => {
    if (!column.editable) {
      return column;
    }
    return {
      ...column,
      onCell: (record: FieldDataType, fieldIndex: number) => ({
        record,
        editable: column.editable,
        dataIndex: column.dataIndex,
        title: column.title,
        EditComponent: column.EditComponent,
        ReadComponent: column.ReadComponent,
        handleSave: (nextRecord: FieldDataType) => updateFieldRecord(collectionIndex, fieldIndex, nextRecord),
      }),
    };
  });
};

const ExpandedFieldRowRender: React.FC<{ record: FieldDataType }> = ({ record }) => {
  const { token } = theme.useToken();
  const labelStyle: React.CSSProperties = {
    color: token.colorTextSecondary,
    marginRight: token.marginXS,
    marginLeft: token.marginXXL,
  };
  const rows: Array<[string, React.ReactNode]> = [
    ['Target', record.target],
    ['TargetKey', record.targetKey],
    ['SourceKey', record.sourceKey],
    ['ForeignKey', record.foreignKey],
    ['OtherKey', record.otherKey],
  ];

  return (
    <>
      {record.enum ? (
        <div>
          <span style={labelStyle}>Enumurations:</span>
          {record.enum.map((item) => (
            <Tag key={item.value}>
              {item.label} ({item.value})
            </Tag>
          ))}
        </div>
      ) : null}
      {rows.map(([label, value]) =>
        value ? (
          <div key={label}>
            <span style={labelStyle}>{label}:</span>
            <span>{value}</span>
          </div>
        ) : null,
      )}
    </>
  );
};

const ExpandedCollectionRowRender: React.FC<{
  record: CollectionDataType;
  collectionIndex: number;
  rowClassName: string;
  updateFieldRecord: (collectionIndex: number, fieldIndex: number, field: FieldDataType) => Promise<void>;
}> = ({ record, collectionIndex, rowClassName, updateFieldRecord }) => {
  const expandColumns = useExpandColumns(record, collectionIndex, updateFieldRecord);

  return (
    <AntdTable<FieldDataType>
      rowKey="name"
      rowClassName={rowClassName}
      columns={expandColumns as FieldColumnTypes}
      components={{ body: { row: EditableRow, cell: EditableCell } }}
      dataSource={record.fields}
      pagination={false}
      expandable={{
        rowExpandable: (field) =>
          Boolean(field.enum?.length) || ['m2m', 'm2o', 'o2m', 'o2o'].includes(String(field.interface)),
        expandedRowRender: (field) => <ExpandedFieldRowRender record={field} />,
      }}
    />
  );
};

export const Table: React.FC<{
  collections: CollectionDataType[];
  updateCollectionRecord: (collectionIndex: number, collection: CollectionDataType) => Promise<void>;
  updateFieldRecord: (collectionIndex: number, fieldIndex: number, field: FieldDataType) => Promise<void>;
}> = ({ collections, updateCollectionRecord, updateFieldRecord }) => {
  const { token } = theme.useToken();
  const columns = useColumns(updateCollectionRecord);
  const rowClassName = useEditableRowClassName();

  return (
    <AntdTable<CollectionDataType>
      scroll={{ y: `calc(100vh - ${token.controlHeightLG + token.marginXXL * 8}px)` }}
      style={{ height: `calc(100vh - ${token.controlHeightLG + token.marginXXL * 6}px)` }}
      rowKey="name"
      rowClassName={rowClassName}
      columns={columns as CollectionColumnTypes}
      dataSource={collections}
      components={{ body: { row: EditableRow, cell: EditableCell } }}
      expandable={{
        expandedRowRender: (record, _index, _indent, expanded) => {
          const collectionIndex = collections.findIndex((item) => item.name === record.name);
          return expanded ? (
            <ExpandedCollectionRowRender
              record={record}
              collectionIndex={collectionIndex}
              rowClassName={rowClassName}
              updateFieldRecord={updateFieldRecord}
            />
          ) : null;
        },
        rowExpandable: (record) => Boolean(record.fields?.length),
      }}
    />
  );
};
