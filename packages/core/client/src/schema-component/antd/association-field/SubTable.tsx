/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { ArrayField } from '@formily/core';
import { exchangeArrayState } from '@formily/core/esm/shared/internals';
import { observer, RecursionField, useFieldSchema } from '@formily/react';
import { action } from '@formily/reactive';
import { isArr } from '@formily/shared';
import { Button } from 'antd';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FormProvider,
  RecordPickerContext,
  RecordPickerProvider,
  SchemaComponentOptions,
  useActionContext,
} from '../..';
import { useCreateActionProps } from '../../../block-provider/hooks';
import { FormActiveFieldsProvider } from '../../../block-provider/hooks/useFormActiveFields';
import { TableSelectorParamsProvider } from '../../../block-provider/TableSelectorProvider';
import { CollectionProvider_deprecated } from '../../../collection-manager';
import { CollectionRecordProvider, useCollection, useCollectionRecord } from '../../../data-source';
import { markRecordAsNew } from '../../../data-source/collection-record/isNewRecord';
import { FlagProvider } from '../../../flag-provider';
import { useCompile } from '../../hooks';
import { ActionContextProvider } from '../action';
import { useSubTableSpecialCase } from '../form-item/hooks/useSpecialCase';
import { Table } from '../table-v2/Table';
import { SubFormProvider, useAssociationFieldContext, useFieldNames } from './hooks';
import { useTableSelectorProps } from './InternalPicker';
import { getLabelFormatValue, useLabelUiSchema } from './util';

const subTableContainer = css`
  .ant-table-footer {
    padding: 0 !important;
  }
  .ant-formily-item-error-help {
    display: none;
  }
  .ant-table-cell .ant-formily-item-error-help {
    display: block;
    position: absolute;
    font-size: 12px;
    top: 100%;
    background: #fff;
    width: 100%;
    margin-top: -15px;
    padding: 3px;
    z-index: 1;
    border-radius: 3px;
    box-shadow: 0 0 10px #eee;
    animation: none;
    transform: translateY(0);
    opacity: 1;
  }
`;

const tableClassName = css`
  .ant-formily-item.ant-formily-item-feedback-layout-loose {
    margin-bottom: 0px !important;
  }
  .ant-formily-editable {
    vertical-align: sub;
  }
  .ant-table-footer {
    display: flex;
  }
`;

const addNewButtonClassName = css`
  display: block;
  border-radius: 0px;
  border-right: 1px solid rgba(0, 0, 0, 0.06);
`;

const selectButtonClassName = css`
  display: block;
  border-radius: 0px;
`;

export const SubTable: any = observer(
  (props: any) => {
    const { openSize } = props;
    const { field, options: collectionField } = useAssociationFieldContext<ArrayField>();
    const { t } = useTranslation();
    const [visibleSelector, setVisibleSelector] = useState(false);
    const [selectedRows, setSelectedRows] = useState([]);
    const fieldNames = useFieldNames(props);
    const fieldSchema = useFieldSchema();
    const compile = useCompile();
    const labelUiSchema = useLabelUiSchema(collectionField, fieldNames?.label || 'label');
    const recordV2 = useCollectionRecord();
    const collection = useCollection();
    const { allowSelectExistingRecord, allowAddnew, allowDisassociation } = field.componentProps;
    useSubTableSpecialCase({ field });
    const move = (fromIndex: number, toIndex: number) => {
      if (toIndex === undefined) return;
      if (!isArr(field.value)) return;
      if (fromIndex === toIndex) return;
      return action(() => {
        const fromItem = field.value[fromIndex];
        field.value.splice(fromIndex, 1);
        field.value.splice(toIndex, 0, fromItem);
        exchangeArrayState(field, {
          fromIndex,
          toIndex,
        });
        return field.onInput(field.value);
      });
    };
    field.move = move;

    const options = useMemo(() => {
      if (field.value && Object.keys(field.value).length > 0) {
        const opts = (Array.isArray(field.value) ? field.value : field.value ? [field.value] : [])
          .filter(Boolean)
          .map((option) => {
            const label = option?.[fieldNames.label];
            return {
              ...option,
              [fieldNames.label]: getLabelFormatValue(compile(labelUiSchema), compile(label)),
            };
          });
        return opts;
      }
      return [];
    }, [field.value, fieldNames?.label]);

    const pickerProps = {
      size: 'small',
      fieldNames: field.componentProps.fieldNames,
      multiple: true,
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
      const { selectedRows, setSelectedRows } = useContext(RecordPickerContext);
      return {
        onClick() {
          selectedRows.map((v) => field.value.push(markRecordAsNew(v)));
          field.onInput(field.value);
          field.initialValue = field.value;
          setSelectedRows([]);
          setVisible(false);
          const totalPages = Math.ceil(field.value.length / (field.componentProps?.pageSize || 10));
          setCurrentPage(totalPages);
        },
      };
    };
    const getFilter = () => {
      const targetKey = collectionField?.targetKey || 'id';
      const list = (field.value || []).map((option) => option?.[targetKey]).filter(Boolean);
      const filter = list.length ? { $and: [{ [`${targetKey}.$ne`]: list }] } : {};
      return filter;
    };
    //分页
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(field.componentProps?.pageSize || 10); // 每页条数
    useEffect(() => {
      setPageSize(field.componentProps?.pageSize);
    }, [field.componentProps?.pageSize]);

    const paginationConfig = useMemo(() => {
      const page = Math.ceil(field.value?.length / 10);
      return {
        current: currentPage > page ? page : currentPage,
        pageSize: pageSize || 10,
        total: field?.value,
        onChange: (page, pageSize) => {
          setCurrentPage(page);
          setPageSize(pageSize);
          field.onInput(field.value);
        },
        showSizeChanger: true,
        pageSizeOptions: ['10', '20', '50', '100'],
        hideOnSinglePage: false,
      };
    }, [field.value?.length, pageSize, currentPage]);
    return (
      <div className={subTableContainer}>
        <FlagProvider isInSubTable>
          <CollectionRecordProvider record={null} parentRecord={recordV2}>
            <FormActiveFieldsProvider name="nester">
              {/* 在这里加，是为了让子表格中默认值的 “当前对象” 的配置显示正确 */}
              <SubFormProvider value={{ value: null, collection, fieldSchema: fieldSchema.parent, skip: true }}>
                <Table
                  className={tableClassName}
                  bordered
                  size={'small'}
                  field={field}
                  showIndex
                  dragSort={false}
                  showDel={
                    allowAddnew !== false || allowSelectExistingRecord !== false || allowDisassociation !== false
                      ? (record) => {
                          if (!field.editable) {
                            return false;
                          }
                          if (allowDisassociation !== false) {
                            return true;
                          }
                          return record?.__isNewRecord__;
                        }
                      : false
                  }
                  pagination={paginationConfig}
                  rowSelection={{ type: 'none', hideSelectAll: true }}
                  footer={() =>
                    field.editable && (
                      <>
                        {allowAddnew !== false && (
                          <Button
                            type={'text'}
                            block
                            className={addNewButtonClassName}
                            onClick={() => {
                              field.value = field.value || [];
                              field.value.push(markRecordAsNew({}));
                              // 计算总页数，并跳转到最后一页
                              const totalPages = Math.ceil(field.value.length / (field.componentProps?.pageSize || 10));
                              setCurrentPage(totalPages);
                              return field.onInput(field.value);
                            }}
                          >
                            {t('Add new')}
                          </Button>
                        )}
                        {allowSelectExistingRecord && (
                          <Button
                            type={'text'}
                            block
                            className={selectButtonClassName}
                            onClick={() => {
                              setVisibleSelector(true);
                            }}
                          >
                            {t('Select')}
                          </Button>
                        )}
                      </>
                    )
                  }
                  isSubTable={true}
                />
              </SubFormProvider>
            </FormActiveFieldsProvider>
          </CollectionRecordProvider>
        </FlagProvider>
        <ActionContextProvider
          value={{
            openSize,
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
                      useCreateActionProps,
                    }}
                  >
                    <RecursionField
                      onlyRenderProperties
                      basePath={field.address}
                      schema={fieldSchema.parent}
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
      </div>
    );
  },
  { displayName: 'SubTable' },
);
