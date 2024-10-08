/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer, RecursionField, useField, useFieldSchema, useForm } from '@formily/react';
import { Select, Space } from 'antd';
import { differenceBy, unionBy, get, xorBy } from 'lodash';
import React, { useContext, useMemo, useState } from 'react';
import {
  FormProvider,
  RecordPickerContext,
  RecordPickerProvider,
  SchemaComponentOptions,
  useActionContext,
} from '../..';
import {
  ClearCollectionFieldContext,
  CollectionProvider_deprecated,
  RecordProvider,
  useCollectionRecordData,
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
import { GeneralField } from '@formily/core';

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
    const { multiple, value, openSize, onChange, quickUpload, selectFile, shouldMountElement, ...others } = props;
    const field: any = useField();
    const form = useForm();
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

    const fieldInterface = collectionField?.interface;
    const pickerProps = {
      size: 'small',
      fieldNames,
      multiple: multiple !== false && ['o2m', 'm2m', 'mbm'].includes(fieldInterface),
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

    const o2mMultiAddMode = useMemo(() => {
      // 如果是多对一，且使用数据选择器进行选择数据，启用多选，进行批量新增
      if (fieldInterface !== 'm2o' || props.mode !== 'Picker') {
        return false;
      }
      const segments = (field as GeneralField).address.segments;
      // 小于2，那么外层结构无法包含subtable
      if (segments.length < 2) {
        return false;
      }
      // 判断外层是不是包含子表格
      const checkSubTableFieldAddressEntire = segments.slice(0, segments.length - 2).join('.');
      const checkSubTableField = form.fields[checkSubTableFieldAddressEntire];
      return (checkSubTableField.component as any[])?.some((c) => c?.mode === 'SubTable');
    }, []);

    if (o2mMultiAddMode) {
      pickerProps.multiple = true;
    }

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
    const usePickActionProps = () => {
      const { setVisible } = useActionContext();
      const { multiple, selectedRows, onChange, options, collectionField } = useContext(RecordPickerContext);
      return {
        onClick() {
          if (multiple) {
            const targetValues = unionBy(selectedRows, options, collectionField?.targetKey || 'id');

            if (o2mMultiAddMode) {
              // 第一项值放入当前行
              const firstTargetValue = targetValues[0] || null;
              // 添加其他新的行
              if (targetValues.length > 1) {
                // 判断当前字段，并取出子表格在form field里面的路径信息
                const fieldPathEntire: string = field.path.entire;
                const fieldPathArr = fieldPathEntire.split('.');
                const subTableFieldNames = fieldPathArr.slice(0, fieldPathArr.length - 2);
                const fieldName = fieldPathArr[fieldPathArr.length - 1];
                const subTableValues: any[] = get(form.values, subTableFieldNames);
                const siblingFieldValues = subTableValues
                  .filter((o) => get(o, 'id') !== get(recordData, 'id'))
                  .map((o) => get(o, fieldName));
                const needAddTargetValues = xorBy(siblingFieldValues, targetValues, 'id').slice(1);
                for (const k of needAddTargetValues) {
                  subTableValues.push({ [fieldName]: k });
                }
              }

              onChange(firstTargetValue);
            } else {
              onChange(targetValues);
            }
          } else {
            onChange(selectedRows?.[0] || null);
          }

          setVisible(false);
        },
        style: {
          display:
            multiple !== false && ['o2m', 'm2m', 'mbm', 'm2o'].includes(collectionField?.interface) ? 'block' : 'none',
        },
      };
    };

    return (
      <>
        <Space.Compact style={{ display: 'flex', lineHeight: '32px' }}>
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
                <RecursionField
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
                  <SchemaComponentOptions
                    scope={{
                      usePickActionProps,
                      useTableSelectorProps,
                    }}
                  >
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
        </ActionContextProvider>
      </>
    );
  },
  { displayName: 'InternalPicker' },
);
