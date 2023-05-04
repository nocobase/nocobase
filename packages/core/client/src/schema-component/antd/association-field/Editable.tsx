import { observer, useField, useFieldSchema, useForm } from '@formily/react';
import React, { useContext, useEffect, useState } from 'react';
import { unionBy, differenceBy } from 'lodash';
import { AssociationFieldProvider } from './AssociationFieldProvider';
import { FileManager } from './FileManager';
import { InternalNester } from './InternalNester';
import { InternalSelect } from './InternalSelect';
import { AssociationSelect } from './AssociationSelect';
import { useCreateActionProps as useCAP } from '../../../block-provider/hooks';
import { flatData } from './util';
import { useTableSelectorProps as useTsp } from '../../../block-provider/TableSelectorProvider';
import { useCollection } from '../../../collection-manager';
import { SchemaComponentOptions, useActionContext, RecordPickerContext } from '../../';
import { InternalSubTable } from './InternalSubTable';

export const Editable = observer((props: any) => {
  const { fieldNames } = props;
  const [currentMode, setCurrentMode] = useState(props.mode || 'Select');
  useEffect(() => {
    props.mode && setCurrentMode(props.mode);
  }, [props.mode]);
  const field: any = useField();
  const form = useForm();
  const fieldSchema = useFieldSchema();
  const { getField } = useCollection();
  const collectionField = getField(field.props.name);
  const useCreateActionProps = () => {
    const { onClick } = useCAP();
    const actionField = useField();
    return {
      async onClick() {
        await onClick();
        const { data } = actionField.data?.data?.data || {};
        if (['oho', 'obo', 'm2o'].includes(collectionField.interface)) {
          form.setValuesIn(field.props.name, {
            [fieldNames.label]: data[fieldNames.label],
            id: data.id,
            value: data.id,
          });
        } else {
          const values = JSON.parse(JSON.stringify(form.values[fieldSchema.name]));
          values.push({
            [fieldNames.label]: data[fieldNames.label],
            id: data?.id,
            value: data?.id,
          });
          form.setValuesIn(field.props.name, values);
        }
      },
    };
  };

  const usePickActionProps = () => {
    const { setVisible } = useActionContext();
    const { multiple, selectedRows, onChange, options, collectionField } = useContext(RecordPickerContext);
    return {
      onClick() {
        if (multiple) {
          onChange(unionBy(selectedRows, options, collectionField?.targetKey || 'id'));
        } else {
          onChange(selectedRows?.[0] || null);
        }
        setVisible(false);
      },
    };
  };

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
          .filter((item) => options.every((row) => row[rowKey] !== item[rowKey]))
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
  return (
    <AssociationFieldProvider>
      <SchemaComponentOptions scope={{ useCreateActionProps, usePickActionProps, useTableSelectorProps }}>
        {currentMode === 'Picker' && <InternalSelect {...props} />}
        {currentMode === 'FileManager' && <FileManager {...props} />}
        {currentMode === 'Nester' && <InternalNester {...props} />}
        {currentMode === 'Select' && <AssociationSelect {...props} />}
        {currentMode === 'SubTable' && <InternalSubTable {...props} />}
      </SchemaComponentOptions>
    </AssociationFieldProvider>
  );
});
