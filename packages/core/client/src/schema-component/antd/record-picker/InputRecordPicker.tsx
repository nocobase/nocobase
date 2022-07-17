import { ArrayField } from '@formily/core';
import { RecursionField, useField, useFieldSchema } from '@formily/react';
import { Select } from 'antd';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTableSelectorProps as useTsp } from '../../../block-provider/TableSelectorProvider';
import { CollectionProvider, useCollection } from '../../../collection-manager';
import { FormProvider, SchemaComponentOptions } from '../../core';
import { useCompile } from '../../hooks';
import { ActionContext, useActionContext } from '../action';
import { useFieldNames } from './useFieldNames';
import { differenceBy, unionBy } from 'lodash';

const RecordPickerContext = createContext(null);

const useTableSelectorProps = () => {
  const field = useField<ArrayField>();
  const { multiple, value, setSelectedRows, selectedRows: rcSelectRows } = useContext(RecordPickerContext);
  const { onRowSelectionChange, rowKey, ...others } = useTsp();
  // console.log('useTableSelectorProps', field.value, value);
  return {
    ...others,
    rowKey,
    rowSelection: {
      type: multiple ? 'checkbox' : 'radio',
      // defaultSelectedRowKeys: rcSelectRows?.map((item) => item[rowKey||'id']),
      selectedRowKeys: rcSelectRows?.map((item) => item[rowKey||'id']),
    },
    onRowSelectionChange(selectedRowKeys, selectedRows) {
      if (multiple) {
        const scopeRows = field.value || [];
        const allSelectedRows = rcSelectRows || [];
        const otherRows = differenceBy(allSelectedRows, scopeRows, rowKey||'id');
        const unionSelectedRows = unionBy(otherRows, selectedRows, rowKey||'id');
        const unionSelectedRowKeys = unionSelectedRows.map((item) => item[rowKey||'id'])
        setSelectedRows?.(unionSelectedRows);
        onRowSelectionChange?.(unionSelectedRowKeys, unionSelectedRows);
      } else {
        setSelectedRows?.(selectedRows);
        onRowSelectionChange?.(selectedRowKeys, selectedRows);
      }
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

const useAssociation = (props) => {
  const fieldSchema = useFieldSchema();
  const { association } = props;
  const { getField } = useCollection();
  if (association) {
    return association;
  }
  return getField(fieldSchema.name);
};

export const InputRecordPicker: React.FC<any> = (props) => {
  const { value, multiple, onChange, ...others } = props;
  const fieldNames = useFieldNames(props);
  const [visible, setVisible] = useState(false);
  const fieldSchema = useFieldSchema();
  const collectionField = useAssociation(props);
  const compile = useCompile();
  
  const [selectedRows, setSelectedRows] = useState([]);
  const [options, setOptions] = useState([]);

  useEffect(() => {
    if (value) {
      const opts = (Array.isArray(value) ? value : value ? [value] : []).map(option => {
        const label = option[fieldNames.label];
        return {
          ...option,
          [fieldNames.label]: compile(label),
        };
      });
      setOptions(opts);
      setSelectedRows(opts);
    }
  }, [value])

  const getValue = () => {
    if (multiple == null) return null;
    // console.log('getValue', multiple, value, Array.isArray(value));
    
    return Array.isArray(value) ? value?.map(v => v[fieldNames.value]) : value?.[fieldNames.value];
  }
  return (
    <div>
      <Select
        {...others}
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
        value={getValue()}
        open={false}
      />
      <RecordPickerContext.Provider value={{ multiple, onChange, selectedRows, setSelectedRows }}>
        <CollectionProvider allowNull name={collectionField?.target}>
          <ActionContext.Provider value={{ openMode: 'drawer', visible, setVisible }}>
            <FormProvider>
              <SchemaComponentOptions scope={{ useTableSelectorProps, usePickActionProps }}>
                <RecursionField
                  schema={fieldSchema}
                  onlyRenderProperties
                  filterProperties={(s) => {
                    return s['x-component'] === 'RecordPicker.Selector';
                  }}
                />
              </SchemaComponentOptions>
            </FormProvider>
          </ActionContext.Provider>
        </CollectionProvider>
      </RecordPickerContext.Provider>
    </div>
  );
};
