import { RecursionField, useField, useFieldSchema, connect } from '@formily/react';
import { Button, Input, Select } from 'antd';
import React, { useState, useEffect, useContext } from 'react';
import { differenceBy, unionBy } from 'lodash';
import { ActionContext } from '../action';
import { useInsertSchema, useFieldNames } from './hooks';
import schema from './schema';
import { useCompile } from '../../hooks';
import { useCollection, CollectionProvider } from '../../../collection-manager';
import {
  RecordPickerProvider,
  SchemaComponentOptions,
  RecordPickerContext,
  useActionContext,
  FormProvider,
} from '../..';
import {
  TableSelectorParamsProvider,
  useTableSelectorProps as useTsp,
} from '../../../block-provider/TableSelectorProvider';
import { getLabelFormatValue, useLabelUiSchema, flatData } from './util';
import { FileSelector, Preview } from '../preview';
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
const InternalFileManager = (props) => {
  const { value, multiple, onChange, quickUpload, selectFile, ...others } = props;
  const fieldSchema = useFieldSchema();
  const [visibleSelector, setVisibleSelector] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const insertSelector = useInsertSchema('Selector');
  const fieldNames = useFieldNames(props);
  const field: any = useField();
  const [options, setOptions] = useState([]);
  const { getField } = useCollection();
  const collectionField = getField(field.props.name);
  const labelUiSchema = useLabelUiSchema(collectionField, fieldNames?.label || 'label');
  const compile = useCompile();
  const getFilter = () => {
    const targetKey = collectionField?.targetKey || 'id';
    const list = options.map((option) => option[targetKey]).filter(Boolean);
    const filter = list.length ? { $and: [{ [`${targetKey}.$ne`]: list }] } : {};
    return filter;
  };
  const handleSelect = () => {
    insertSelector(schema.Selector);
    setVisibleSelector(true);
    setSelectedRows([]);
  };

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

  const handleRemove = (file) => {
    const newOptions = options.filter((option) => option.id !== file.id);
    setOptions(newOptions);
    if (newOptions.length === 0) {
      return onChange(null);
    }
    onChange(newOptions);
  };
  const pickerProps = {
    size: 'small',
    fieldNames,
    multiple: ['o2m', 'm2m'].includes(collectionField?.interface),
    association: {
      target: collectionField?.target,
    },
    onChange: props?.onChange,
    selectedRows,
    setSelectedRows,
    collectionField,
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
  return (
    <div>
      <FileSelector
        value={options}
        multiple={multiple}
        quickUpload={quickUpload !== false}
        selectFile={selectFile !== false}
        action={`${collectionField?.target}:create`}
        onSelect={handleSelect}
        onRemove={handleRemove}
        onChange={(changed) => {
          if (changed.every((file) => file.status !== 'uploading')) {
            changed = changed.filter((file) => file.status === 'done').map((file) => file.response.data);
            if (multiple) {
              onChange([...options, ...changed]);
            } else {
              onChange(changed[0]);
            }
          }
        }}
      />
      <ActionContext.Provider value={{ openMode: 'drawer', visible: visibleSelector, setVisible: setVisibleSelector }}>
        <RecordPickerProvider {...pickerProps}>
          <CollectionProvider name={collectionField.target}>
            <FormProvider>
              <TableSelectorParamsProvider params={{ filter: getFilter() }}>
                <SchemaComponentOptions scope={{ usePickActionProps, useTableSelectorProps }}>
                  <RecursionField
                    onlyRenderProperties
                    basePath={field.address}
                    schema={fieldSchema}
                    filterProperties={(s) => {
                      return s['x-component'] === 'AssociationField.Selector';
                    }}
                  />
                </SchemaComponentOptions>
              </TableSelectorParamsProvider>
            </FormProvider>
          </CollectionProvider>
        </RecordPickerProvider>
      </ActionContext.Provider>
    </div>
  );
};

const FileManageReadPretty = connect((props) => {
  const field: any = useField();
  const { getField } = useCollection();
  const collectionField = getField(field.props.name);
  return collectionField ? <Preview {...props} /> : null;
});

export { InternalFileManager, FileManageReadPretty };
