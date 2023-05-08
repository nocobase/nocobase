import { Field } from '@formily/core';
import { observer, useField, useFieldSchema, RecursionField, useForm } from '@formily/react';
import React, { useEffect, useContext, useState } from 'react';
import { unionBy, differenceBy } from 'lodash';
import { useInsertSchema } from './hooks';
import { useCollection } from '../../../collection-manager';
import schema from './schema';
import { flatData } from './util';
import { RecordPickerProvider, SchemaComponentOptions, RecordPickerContext, useActionContext } from '../../';
import {
  TableSelectorParamsProvider,
  useTableSelectorProps as useTsp,
} from '../../../block-provider/TableSelectorProvider';
import { useTableBlockProps as useTableP } from '../../../';

const useTableSelectorProps = () => {
  const field: any = useField();
  const {
    multiple,
    options = [],
    setSelectedRows,
    selectedRows: rcSelectRows = [],
    onChange,
  } = useContext(RecordPickerContext);
  const { onRowSelectionChange, rowKey = 'id', ...others } = useTsp();
  const { setVisible } = useActionContext();
  return {
    ...others,
    rowKey,
    rowSelection: {
      type: multiple ? 'checkbox' : 'radio',
      selectedRowKeys: rcSelectRows
        ?.filter((item) => options.every((row) => row[rowKey] !== item[rowKey]))
        .map((item) => item[rowKey]),
    },
    onRowSelectionChange(selectedRowKeys, selectedRows) {
      if (multiple) {
        const scopeRows = flatData(field.value) || [];
        const allSelectedRows = rcSelectRows || [];
        const otherRows = differenceBy(allSelectedRows, scopeRows, rowKey);
        const unionSelectedRows = unionBy(otherRows, selectedRows, rowKey);
        const unionSelectedRowKeys = unionSelectedRows.map((item) => item[rowKey]);
        setSelectedRows?.(unionSelectedRows);
        onRowSelectionChange?.(unionSelectedRowKeys, unionSelectedRows);
      } else {
        setSelectedRows?.(selectedRows);
        onRowSelectionChange?.(selectedRowKeys, selectedRows);
        onChange(selectedRows?.[0] || null);
        setVisible(false);
      }
    },
  };
};

export const useTableBlockProps = () => {
  const field: any = useField();
  const tableProps = useTableP();
  const { tableData } = useContext(RecordPickerContext);
  useEffect(() => {
    field.value = tableData;
  }, [tableData]);
  return {
    ...tableProps,
  };
};

export const InternalSubTable: any = observer((props: any) => {
  const fieldSchema = useFieldSchema();
  const field: any = useField<Field>();
  const insertSubTable = useInsertSchema('SubTable');
  const { getField } = useCollection();
  const form = useForm();
  const collectionField = getField(field.props.name);
  const [selectedRows, setSelectedRows] = useState([]);
  const [tableData, setTableData] = useState(field.value);
  const pickerProps = {
    size: 'small',
    multiple: ['o2m', 'm2m'].includes(collectionField?.interface),
    association: {
      target: collectionField?.target,
    },
    onChange: props?.onChange,
    selectedRows,
    setSelectedRows,
    collectionField,
    tableData,
    setTableData,
  };

  useEffect(() => {
    const association = `${collectionField.collectionName}.${collectionField.name}`;
    (schema.SubTable['x-acl-action'] = `${collectionField.target}:list`),
      (schema.SubTable['x-decorator-props'] = {
        collection: collectionField.target,
        association: association,
        resource: association,
        action: 'list',
        params: {
          paginate: false,
        },
        showIndex: true,
        dragSort: false,
      }),
      insertSubTable(schema.SubTable);
  }, []);

  const usePickActionProps = () => {
    const { setVisible } = useActionContext();
    const { multiple, selectedRows, onChange, collectionField, setTableData, tableData } =
      useContext(RecordPickerContext);
    return {
      onClick() {
        if (multiple) {
          const values = JSON.parse(JSON.stringify(form.values[fieldSchema.name]));
          const data = unionBy(selectedRows, values, collectionField?.targetKey || 'id');
          form.setValuesIn(fieldSchema.name, data);
          onChange(data);
          setTableData(data);
        } else {
          form.setValuesIn(fieldSchema.name, selectedRows?.[0] || null);
          onChange(selectedRows?.[0] || null);
        }
        setVisible(false);
      },
    };
  };
  const getFilter = () => {
    const targetKey = collectionField?.targetKey || 'id';
    const list = field.value.map((option) => option[targetKey]).filter(Boolean);
    const filter = list.length ? { $and: [{ [`${targetKey}.$ne`]: list }] } : {};
    return filter;
  };
  return (
    <div>
      <SchemaComponentOptions scope={{ usePickActionProps, useTableSelectorProps, useTableBlockProps }}>
        <RecordPickerProvider {...pickerProps}>
          <TableSelectorParamsProvider params={{ filter: getFilter() }}>
            <RecursionField
              onlyRenderProperties
              basePath={field.address}
              schema={fieldSchema}
              filterProperties={(s) => {
                return s['x-component'] === 'AssociationField.SubTable';
              }}
            />
          </TableSelectorParamsProvider>
        </RecordPickerProvider>
      </SchemaComponentOptions>
    </div>
  );
});
