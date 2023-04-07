import { ArrayField } from '@formily/core';
import { RecursionField, useField, useFieldSchema } from '@formily/react';
import { Select } from 'antd';
import { differenceBy, unionBy } from 'lodash';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTableSelectorProps as useTsp } from '../../../block-provider/TableSelectorProvider';
import { CollectionProvider, useCollection } from '../../../collection-manager';
import { FormProvider, SchemaComponentOptions } from '../../core';
import { useCompile } from '../../hooks';
import { ActionContext, useActionContext } from '../action';
import { FileSelector } from '../preview';
import { useFieldNames } from './useFieldNames';
import { getLabelFormatValue, useLabelUiSchema } from './util';

export const RecordPickerContext = createContext(null);

function flatData(data) {
  let newArr = [];
  for (let i = 0; i < data.length; i++) {
    const children = data[i]['children'];
    if (Array.isArray(children)) {
      newArr.push(...flatData(children));
    }
    newArr.push({ ...data[i] });
  }
  return newArr;
}

const useTableSelectorProps = () => {
  const field = useField<ArrayField>();
  const { multiple, options = [], setSelectedRows, selectedRows: rcSelectRows = [] } = useContext(RecordPickerContext);
  const { onRowSelectionChange, rowKey = 'id', ...others } = useTsp();
  return {
    ...others,
    rowKey,
    rowSelection: {
      type: multiple ? 'checkbox' : 'radio',
      selectedRowKeys: rcSelectRows
        .filter((item) => options.every((row) => row[rowKey] !== item[rowKey]))
        .map((item) => item[rowKey]),
    },
    dataSource: field.value?.filter((item) => options.every((row) => row[rowKey] !== item[rowKey])),
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
      }
    },
  };
};

const usePickActionProps = () => {
  const { setVisible } = useActionContext();
  const { multiple, selectedRows, onChange, options } = useContext(RecordPickerContext);
  return {
    onClick() {
      if (multiple) {
        onChange([...options, ...selectedRows]);
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
  const labelUiSchema = useLabelUiSchema(collectionField, fieldNames?.label || 'label');
  const showFilePicker = isShowFilePicker(labelUiSchema);
  const [selectedRows, setSelectedRows] = useState([]);
  const [options, setOptions] = useState([]);

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
    }
  }, [value, fieldNames?.label]);

  const getValue = () => {
    if (multiple == null) return null;

    return Array.isArray(value) ? value?.map((v) => v[fieldNames.value]) : value?.[fieldNames.value];
  };

  const handleSelect = () => {
    setVisible(true);
  };

  const handleRemove = (file) => {
    const newOptions = options.filter((option) => option.id !== file.id);
    setOptions(newOptions);
    if (newOptions.length === 0) {
      return onChange(null);
    }
    onChange(newOptions);
  };

  return (
    <div>
      {showFilePicker ? (
        <FileSelector value={options} multiple onSelect={handleSelect} onRemove={handleRemove} />
      ) : (
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
      )}
      {Drawer({
        multiple,
        onChange,
        selectedRows,
        setSelectedRows,
        collectionField,
        visible,
        setVisible,
        fieldSchema,
        options,
      })}
    </div>
  );
};

const Drawer: React.FunctionComponent<{
  multiple: any;
  onChange: any;
  selectedRows: any[];
  setSelectedRows: React.Dispatch<React.SetStateAction<any[]>>;
  collectionField: any;
  visible: boolean;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
  fieldSchema;
  options: any[];
}> = ({
  multiple,
  onChange,
  selectedRows,
  setSelectedRows,
  collectionField,
  visible,
  setVisible,
  fieldSchema,
  options,
}) => {
  return (
    <RecordPickerContext.Provider value={{ multiple, onChange, selectedRows, setSelectedRows, options }}>
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
  );
};

export function isShowFilePicker(labelUiSchema) {
  return labelUiSchema?.['x-component'] === 'Preview';
}
