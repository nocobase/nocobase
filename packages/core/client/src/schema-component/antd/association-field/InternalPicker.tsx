/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer, useField, useFieldSchema } from '@formily/react';
import { transformMultiColumnToSingleColumn } from '@nocobase/utils/client';
import { Select, Space } from 'antd';
import { differenceBy, unionBy } from 'lodash';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
  FormProvider,
  PopupSettingsProvider,
  RecordPickerContext,
  RecordPickerProvider,
  SchemaComponentOptions,
  useActionContext,
} from '../..';
import {
  ClearCollectionFieldContext,
  CollectionProvider_deprecated,
  NocoBaseRecursionField,
  RecordProvider,
  useCollectionRecordData,
  useMobileLayout,
} from '../../..';
import { useFormBlockContext } from '../../../block-provider/FormBlockProvider';
import {
  TableSelectorParamsProvider,
  useTableSelectorProps as useTsp,
} from '../../../block-provider/TableSelectorProvider';
import { useCompile } from '../../hooks';
import { ActionContextProvider } from '../action';
import { useAssociationFieldContext, useFieldNames, useInsertSchema } from './hooks';
import schema from './schema';
import { flatData, getLabelFormatValue, useLabelUiSchema } from './util';

export const useTableSelectorProps = () => {
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

export const InternalPicker = observer(
  (props: any) => {
    const { value, multiple, openSize, onChange, quickUpload, selectFile, shouldMountElement, ...others } = props;
    const field: any = useField();
    const fieldNames = useFieldNames(props);
    const [visibleSelector, setVisibleSelector] = useState(false);
    const fieldSchema = useFieldSchema();
    const insertSelector = useInsertSchema('Selector');
    const { options: collectionField } = useAssociationFieldContext();
    const { collectionName } = useFormBlockContext();
    const compile = useCompile();
    const labelUiSchema = useLabelUiSchema(collectionField, fieldNames?.label || 'label');
    const isAllowAddNew = fieldSchema['x-add-new'];
    const [selectedRows, setSelectedRows] = useState([]);
    const recordData = useCollectionRecordData();
    const options = useMemo(() => {
      if (value && Object.keys(value).length > 0) {
        const opts = (Array.isArray(value) ? value : value ? [value] : []).filter(Boolean).map((option) => {
          const label = option?.[fieldNames.label];
          return {
            ...option,
            [fieldNames.label]: getLabelFormatValue(compile(labelUiSchema), compile(label)),
          };
        });
        return opts;
      }
      return [];
    }, [value, fieldNames?.label]);
    const pickerProps = {
      size: 'small',
      fieldNames,
      multiple:
        multiple === true ? true : multiple !== false && ['o2m', 'm2m', 'mbm'].includes(collectionField?.interface),
      association: {
        target: collectionField?.target,
      },
      options,
      onChange: props?.onChange,
      selectedRows,
      setSelectedRows,
      collectionField,
      currentFormCollection: collectionName,
    };
    const { isMobileLayout } = useMobileLayout();

    const getValue = () => {
      if (multiple == null) return null;
      return Array.isArray(value)
        ? value.filter(Boolean)?.map((v) => v?.[fieldNames.value])
        : value?.[fieldNames.value];
    };
    const getFilter = () => {
      const targetKey = collectionField?.targetKey || 'id';
      const list = options.map((option) => option[targetKey]).filter(Boolean);
      const filter = list.length ? { $and: [{ [`${targetKey}.$ne`]: list }] } : {};
      return filter;
    };
    useEffect(() => {
      if (!value) {
        setSelectedRows([]);
      }
    }, [value]);
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
        style: {
          display: multiple === false ? 'none' : 'block',
        },
      };
    };
    const scope = useMemo(
      () => ({
        usePickActionProps,
        useTableSelectorProps,
      }),
      [],
    );
    const newSchema = useMemo(
      () => (isMobileLayout ? transformMultiColumnToSingleColumn(fieldSchema) : fieldSchema),
      [isMobileLayout, fieldSchema],
    );

    return (
      <PopupSettingsProvider enableURL={false}>
        <Space.Compact style={{ display: 'flex' }}>
          <div style={{ width: '100%' }}>
            <Select
              role="button"
              data-testid="select-data-picker"
              style={{ width: '100%' }}
              popupMatchSelectWidth={false}
              {...others}
              mode={multiple ? 'multiple' : props.mode}
              fieldNames={fieldNames}
              onDropdownVisibleChange={(open) => {
                insertSelector(schema.Selector);
                setVisibleSelector(true);
              }}
              allowClear
              onChange={(changed: any) => {
                if (!changed) {
                  const value = multiple ? [] : null;
                  onChange(value);
                  setSelectedRows(value);
                } else if (Array.isArray(changed)) {
                  if (!changed.length) {
                    onChange([]);
                    setSelectedRows([]);
                    return;
                  }
                  const values = options?.filter((option) => changed.includes(option[fieldNames.value]));
                  onChange(values);
                  setSelectedRows(values);
                }
              }}
              options={options}
              value={getValue()}
              open={false}
            />
          </div>
          {isAllowAddNew && (
            <RecordProvider isNew record={null} parent={recordData}>
              {/* 快捷添加按钮添加的添加的是一个普通的 form 区块（非关系区块），不应该与任何字段有关联，所以在这里把字段相关的上下文给清除掉 */}
              <ClearCollectionFieldContext>
                <NocoBaseRecursionField
                  onlyRenderProperties
                  basePath={field.address}
                  schema={fieldSchema}
                  filterProperties={(s) => {
                    return s['x-component'] === 'Action';
                  }}
                />
              </ClearCollectionFieldContext>
            </RecordProvider>
          )}
        </Space.Compact>
        <ActionContextProvider
          value={{
            openSize: fieldSchema['x-component-props']?.['openSize'] || openSize,
            openMode: 'drawer',
            visible: visibleSelector,
            setVisible: setVisibleSelector,
          }}
        >
          <RecordPickerProvider {...pickerProps}>
            <CollectionProvider_deprecated name={collectionField?.target}>
              <FormProvider>
                <TableSelectorParamsProvider params={{ filter: getFilter() }}>
                  <SchemaComponentOptions scope={scope}>
                    <NocoBaseRecursionField
                      onlyRenderProperties
                      basePath={field.address}
                      schema={newSchema}
                      filterProperties={(s) => {
                        return s['x-component'] === 'AssociationField.Selector';
                      }}
                    />
                  </SchemaComponentOptions>
                </TableSelectorParamsProvider>
              </FormProvider>
            </CollectionProvider_deprecated>
          </RecordPickerProvider>
        </ActionContextProvider>
      </PopupSettingsProvider>
    );
  },
  { displayName: 'InternalPicker' },
);
