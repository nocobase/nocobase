import { RecursionField, connect, useField, useFieldSchema } from '@formily/react';
import { differenceBy, unionBy } from 'lodash';
import React, { useContext, useEffect, useState } from 'react';
import {
  FormProvider,
  RecordPickerContext,
  RecordPickerProvider,
  SchemaComponentOptions,
  useActionContext,
} from '../..';
import {
  TableSelectorParamsProvider,
  useTableSelectorProps as useTsp,
} from '../../../block-provider/TableSelectorProvider';
import { CollectionProvider, useCollection, useCollectionManager } from '../../../collection-manager';
import { useCompile } from '../../hooks';
import { ActionContextProvider } from '../action';
import { FileSelector, Preview } from '../preview';
import { ReadPrettyInternalViewer } from './InternalViewer';
import { useFieldNames, useInsertSchema } from './hooks';
import schema from './schema';
import { flatData, getLabelFormatValue, isShowFilePicker, useLabelUiSchema } from './util';
import { EllipsisWithTooltip } from '../input';

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
  const labelUiSchema = useLabelUiSchema(collectionField?.target, fieldNames?.label || 'label');
  const compile = useCompile();
  const { modalProps } = useActionContext();
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
    if (value && Object.keys(value).length > 0) {
      const opts = (Array.isArray(value) ? value : value ? [value] : []).map((option) => {
        const label = option[fieldNames.label];
        return {
          ...option,
          [fieldNames.label]: getLabelFormatValue(compile(labelUiSchema), compile(label)),
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
    options,
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
    <div style={{ width: '100%', overflow: 'auto' }}>
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
      <ActionContextProvider
        value={{
          openMode: 'drawer',
          visible: visibleSelector,
          setVisible: setVisibleSelector,
          modalProps: {
            getContainer: others?.getContainer || modalProps?.getContainer,
          },
          formValueChanged: false,
        }}
      >
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
      </ActionContextProvider>
    </div>
  );
};

const FileManageReadPretty = connect((props) => {
  const fieldNames = useFieldNames(props);
  const fieldSchema = useFieldSchema();
  const { getField } = useCollection();
  const { getCollectionJoinField } = useCollectionManager();
  const collectionField = getField(fieldSchema.name) || getCollectionJoinField(fieldSchema['x-collection-field']);
  const labelUiSchema = useLabelUiSchema(collectionField?.target, fieldNames?.label || 'label');
  const showFilePicker = isShowFilePicker(labelUiSchema);
  if (showFilePicker) {
    return (
      <EllipsisWithTooltip ellipsis>
        {collectionField ? <Preview {...props} fieldNames={fieldNames} /> : null}
      </EllipsisWithTooltip>
    );
  } else {
    return <ReadPrettyInternalViewer {...props} />;
  }
});

export { FileManageReadPretty, InternalFileManager };
