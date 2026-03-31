/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { RecursionField, connect, mapReadPretty, useField, useFieldSchema } from '@formily/react';
import React, { useContext, useEffect, useState } from 'react';
import {
  FormProvider,
  RecordPickerContext,
  RecordPickerProvider,
  SchemaComponentOptions,
  useActionContext,
  TableSelectorParamsProvider,
  useTableSelectorProps as useTsp,
  EllipsisWithTooltip,
  CollectionProvider_deprecated,
  useCollection_deprecated,
  useCollectionManager_deprecated,
  Upload,
  useFieldNames,
  ActionContextProvider,
  AssociationField,
  Input,
} from '@nocobase/client';
import schema from '../schema';
import { useInsertSchema } from '../hook';

const defaultToValueItem = (data) => {
  return data?.thumbnailRule ? `${data?.url}${data?.thumbnailRule}` : data?.url;
};

const InnerAttachmentUrl = (props) => {
  const { value, onChange, toValueItem = defaultToValueItem, disabled, underFilter, ...others } = props;
  const fieldSchema = useFieldSchema();
  const [visibleSelector, setVisibleSelector] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const insertSelector = useInsertSchema('Selector');
  const fieldNames = useFieldNames(props);
  const field: any = useField();
  const [options, setOptions] = useState();
  const { getField } = useCollection_deprecated();
  const collectionField = getField(field.props.name);
  const { modalProps } = useActionContext();
  const handleSelect = (ev) => {
    ev.stopPropagation();
    ev.preventDefault();
    insertSelector(schema.Selector);
    setVisibleSelector(true);
    setSelectedRows([]);
  };

  useEffect(() => {
    if (value && Object.keys(value).length > 0) {
      setOptions(value);
    } else {
      setOptions(null);
    }
  }, [value, fieldNames?.label]);

  const pickerProps = {
    size: 'small',
    fieldNames,
    multiple: false,
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
    const { selectedRows, onChange } = useContext(RecordPickerContext);
    return {
      onClick() {
        onChange(toValueItem(selectedRows?.[0]) || null);
        setVisible(false);
      },
    };
  };
  const useTableSelectorProps = () => {
    const {
      multiple,
      options,
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
        selectedRowKeys: rcSelectRows?.filter((item) => options?.[rowKey] !== item[rowKey]).map((item) => item[rowKey]),
      },
      onRowSelectionChange(selectedRowKeys, selectedRows) {
        setSelectedRows?.(selectedRows);
        onRowSelectionChange?.(selectedRowKeys, selectedRows);
        onChange(toValueItem(selectedRows?.[0]) || null);
        setVisible(false);
      },
    };
  };
  if (underFilter) {
    return <Input {...props} />;
  }
  return (
    <div style={{ width: '100%', overflow: 'auto' }}>
      <AssociationField.FileSelector
        toValueItem={toValueItem}
        value={options}
        quickUpload={fieldSchema['x-component-props']?.quickUpload !== false}
        selectFile={
          collectionField?.target && collectionField?.target !== 'attachments'
            ? fieldSchema['x-component-props']?.selectFile !== false
            : false
        }
        action={`${collectionField?.target || 'attachments'}:create`}
        onSelect={handleSelect}
        onChange={onChange}
        disabled={disabled}
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
        {collectionField?.target && collectionField?.target !== 'attachments' && (
          <RecordPickerProvider {...pickerProps}>
            <CollectionProvider_deprecated name={collectionField?.target} dataSource={'main'}>
              <FormProvider>
                <TableSelectorParamsProvider params={{}}>
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
            </CollectionProvider_deprecated>
          </RecordPickerProvider>
        )}
      </ActionContextProvider>
    </div>
  );
};

const FileManageReadPretty = connect((props) => {
  const { value } = props;
  const fieldSchema = useFieldSchema();
  const componentMode = fieldSchema?.['x-component-props']?.['componentMode'];
  const { getField } = useCollection_deprecated();
  const { getCollectionJoinField } = useCollectionManager_deprecated();
  const collectionField = getField(fieldSchema.name) || getCollectionJoinField(fieldSchema['x-collection-field']);
  if (componentMode === 'url') {
    return <EllipsisWithTooltip ellipsis>{value}</EllipsisWithTooltip>;
  }
  return (
    <EllipsisWithTooltip ellipsis>{collectionField ? <Upload.ReadPretty {...props} /> : null}</EllipsisWithTooltip>
  );
});

export const AttachmentUrl = connect(InnerAttachmentUrl, mapReadPretty(FileManageReadPretty));
