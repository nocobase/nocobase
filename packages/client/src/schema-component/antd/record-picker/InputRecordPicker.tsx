import { RecursionField, useFieldSchema } from '@formily/react';
import { Select } from 'antd';
import React, { createContext, useContext, useState } from 'react';
import { useTableSelectorProps as useTsp } from '../../../block-provider/TableSelectorProvider';
import { CollectionProvider, useCollection } from '../../../collection-manager';
import { FormProvider, SchemaComponentOptions } from '../../core';
import { ActionContext, useActionContext } from '../action';
import { useFieldNames } from './useFieldNames';

const RecordPickerContext = createContext(null);

const useTableSelectorProps = () => {
  const { multiple, setSelectedRows, selectedRows } = useContext(RecordPickerContext);
  const { onRowSelectionChange, ...others } = useTsp();
  return {
    ...others,
    rowSelection: {
      type: multiple ? 'checkbox' : 'radio',
      selectedRowKeys: selectedRows?.map((item) => item.id),
    },
    onRowSelectionChange(selectedRowKeys, selectedRows) {
      onRowSelectionChange?.(selectedRowKeys, selectedRows);
      setSelectedRows?.(selectedRows);
    },
  };
};

const usePickActionProps = () => {
  const { setVisible } = useActionContext();
  const { multiple, selectedRows, onChange } = useContext(RecordPickerContext);
  return {
    onClick() {
      if (multiple) {
        onChange(selectedRows);
      } else {
        onChange(selectedRows?.[0] || null);
      }
      setVisible(false);
    },
  };
};

export const InputRecordPicker: React.FC<any> = (props) => {
  const { value, multiple, onChange } = props;
  const fieldNames = useFieldNames(props);
  const [visible, setVisible] = useState(false);
  const fieldSchema = useFieldSchema();
  const [selectedRows, setSelectedRows] = useState([]);
  const { getField } = useCollection();
  const collectionField = getField(fieldSchema.name);
  const options = Array.isArray(value) ? value : value ? [value] : [];
  const values = options?.map((option) => option[fieldNames.value]);
  return (
    <div>
      <Select
        size={props.size}
        mode={multiple ? 'multiple' : props.mode}
        fieldNames={fieldNames}
        onDropdownVisibleChange={(open) => {
          setVisible(true);
        }}
        allowClear
        onChange={(changed: any) => {
          if (!changed) {
            onChange(null);
            setSelectedRows([]);
          } else if (!changed?.length) {
            onChange(null);
            setSelectedRows([]);
          } else if (Array.isArray(changed)) {
            const values = options?.filter((option) => changed.includes(option[fieldNames.value]));
            onChange(values);
            setSelectedRows(values);
          }
        }}
        options={options}
        value={multiple ? values : values?.[0]}
        open={false}
      />
      <RecordPickerContext.Provider value={{ multiple, onChange, selectedRows, setSelectedRows }}>
        <CollectionProvider name={collectionField.target}>
          <ActionContext.Provider value={{ openMode: 'drawer', visible, setVisible }}>
            <FormProvider>
              <SchemaComponentOptions scope={{ useTableSelectorProps, usePickActionProps }}>
                <RecursionField schema={fieldSchema} onlyRenderProperties />
              </SchemaComponentOptions>
            </FormProvider>
          </ActionContext.Provider>
        </CollectionProvider>
      </RecordPickerContext.Provider>
    </div>
  );
};
