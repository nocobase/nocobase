import { ArrayField } from '@formily/core';
import { RecursionField, useField, useFieldSchema } from '@formily/react';
import { Select } from 'antd';
import { differenceBy, unionBy } from 'lodash';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useFilterByTk } from '../../../block-provider';
import { useTableSelectorProps as useTsp } from '../../../block-provider/TableSelectorProvider';
import { CollectionProvider, useCollection, useCollectionField } from '../../../collection-manager';
import { FormProvider, SchemaComponentOptions } from '../../core';
import { useCompile } from '../../hooks';
import { ActionContext, useActionContext } from '../action';
import { useFieldNames } from './useFieldNames';
import { getLabelFormatValue, useLabelUiSchema } from './util';

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
      selectedRowKeys: rcSelectRows?.map((item) => item[rowKey || 'id']),
    },
    onRowSelectionChange(selectedRowKeys, selectedRows) {
      if (multiple) {
        const scopeRows = field.value || [];
        const allSelectedRows = rcSelectRows || [];
        const otherRows = differenceBy(allSelectedRows, scopeRows, rowKey || 'id');
        const unionSelectedRows = unionBy(otherRows, selectedRows, rowKey || 'id');
        const unionSelectedRowKeys = unionSelectedRows.map((item) => item[rowKey || 'id']);
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

const SelectField = (props) => {
  const { useSelect, value, multiple, onChange, ...others } = props;
  const fieldNames = useFieldNames(props);
  const { setVisible } = useActionContext();
  const { setSelectedRows } = useContext(RecordPickerContext);

  const getValue = () => {
    if (multiple == null) return null;
    // console.log('getValue', multiple, value, Array.isArray(value));

    return Array.isArray(value) ? value?.map((v) => v[fieldNames.value]) : value?.[fieldNames.value];
  };

  const compile = useCompile();
  const collectionField = useAssociation(props);
  const labelUiSchema = useLabelUiSchema(collectionField, fieldNames?.label || 'label');

  const [options, setOptions] = useState([]);
  const { resource } = useCollection();

  useEffect(() => {
    if (useSelect) {
      resource.list().then((res) => {
        setOptions(
          res.data.data.map((item) => {
            return item;
          }),
        );
      });
    }
  }, [useSelect]);

  useEffect(() => {
    if (value) {
      const opts = (Array.isArray(value) ? value : value ? [value] : []).map((option) => {
        const label = option[fieldNames.label];
        return {
          ...option,
          [fieldNames.label]: getLabelFormatValue(labelUiSchema, compile(label)),
        };
      });
      setOptions(opts);
      setSelectedRows(opts);
    }
  }, [value, fieldNames?.label]);

  return (
    <Select
      {...others}
      mode={multiple ? 'multiple' : props.mode}
      fieldNames={fieldNames}
      onDropdownVisibleChange={
        !useSelect
          ? (open) => {
              setVisible(true);
            }
          : undefined
      }
      allowClear
      onChange={(changed: any) => {
        if (changed) {
          onChange(changed);
          setSelectedRows(changed);
          return;
        }
        if (!changed || !changed?.length) {
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
      open={useSelect ? undefined : false}
    />
  );
};

export const InputRecordPicker: React.FC<any> = (props) => {
  const { value, multiple, onChange, ...others } = props;
  const [visible, setVisible] = useState(false);
  const fieldSchema = useFieldSchema();
  const useSelect = fieldSchema['x-component-props'].type === 'Select';
  const collectionField = useAssociation(props);
  const [selectedRows, setSelectedRows] = useState([]);

  return (
    <div>
      <RecordPickerContext.Provider value={{ multiple, onChange, selectedRows, setSelectedRows }}>
        <CollectionProvider allowNull name={collectionField?.target}>
          <ActionContext.Provider value={{ openMode: 'drawer', visible, setVisible }}>
            <SelectField {...props} useSelect={useSelect} />
            {!useSelect ? (
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
            ) : null}
          </ActionContext.Provider>
        </CollectionProvider>
      </RecordPickerContext.Provider>
    </div>
  );
};
