import { Field } from '@formily/core';
import { observer, useField, useFieldSchema, RecursionField, useForm } from '@formily/react';
import React, { useEffect, useContext, useState } from 'react';
import { unionBy, differenceBy } from 'lodash';
import { useInsertSchema } from './hooks';
import { useCollection } from '../../../collection-manager';
import schema from './schema';
import { flatData } from './util';
import { RecordPickerProvider, SchemaComponentOptions, RecordPickerContext, useActionContext } from '../../';
import { useTableSelectorProps as useTsp } from '../../../block-provider/TableSelectorProvider';

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

export const InternalSubTable: any = observer((props: any) => {
  const fieldSchema = useFieldSchema();
  const field: any = useField<Field>();
  const insertSubTable = useInsertSchema('SubTable');
  const { getField } = useCollection();
  const form = useForm();
  const collectionField = getField(field.props.name);
  const [selectedRows, setSelectedRows] = useState([]);
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
    field.value = [];
  }, []);

  const usePickActionProps = () => {
    const { setVisible } = useActionContext();
    const { multiple, selectedRows, onChange, options, collectionField } = useContext(RecordPickerContext);
    return {
      onClick() {
        if (multiple) {
          form.setValuesIn(fieldSchema.name, unionBy(selectedRows, options, collectionField?.targetKey || 'id'));
          onChange(unionBy(selectedRows, options, collectionField?.targetKey || 'id'));
        } else {
          form.setValuesIn(fieldSchema.name, selectedRows?.[0] || null);
          onChange(selectedRows?.[0] || null);
        }
        setVisible(false);
      },
    };
  };
  return (
    <div>
      <SchemaComponentOptions scope={{ usePickActionProps, useTableSelectorProps }}>
        <RecordPickerProvider {...pickerProps}>
          <RecursionField
            onlyRenderProperties
            basePath={field.address}
            schema={fieldSchema}
            filterProperties={(s) => {
              return s['x-component'] === 'AssociationField.SubTable';
            }}
          />
        </RecordPickerProvider>
      </SchemaComponentOptions>
    </div>
  );
});
