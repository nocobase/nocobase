import { css } from '@emotion/css';
import { ArrayField } from '@formily/core';
import { exchangeArrayState } from '@formily/core/esm/shared/internals';
import { observer, RecursionField, useFieldSchema } from '@formily/react';
import { action } from '@formily/reactive';
import { isArr } from '@formily/shared';
import { Button } from 'antd';
import { unionBy, uniqBy } from 'lodash';
import React, { useContext, useMemo, useState } from 'react';
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
import { CollectionRecordProvider, useCollectionRecord } from '../../../data-source';
import { FlagProvider } from '../../../flag-provider';
import { useCompile } from '../../hooks';
import { ActionContextProvider } from '../action';
import { Table } from '../table-v2/Table';
import { useAssociationFieldContext, useFieldNames } from './hooks';
import { useTableSelectorProps } from './InternalPicker';
import { getLabelFormatValue, useLabelUiSchema } from './util';
import { markRecordAsNew } from '../../../data-source/collection-record/isNewRecord';

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
      const { selectedRows, options, collectionField } = useContext(RecordPickerContext);
      return {
        onClick() {
          const selectData = unionBy(selectedRows, options, collectionField?.targetKey || 'id');
          const data = field.value || [];
          field.value = uniqBy(data.concat(selectData), collectionField?.targetKey || 'id');
          field.onInput(field.value);
          setVisible(false);
        },
      };
    };
    const getFilter = () => {
      const targetKey = collectionField?.targetKey || 'id';
      const list = options.map((option) => option[targetKey]).filter(Boolean);
      const filter = list.length ? { $and: [{ [`${targetKey}.$ne`]: list }] } : {};
      return filter;
    };
    return (
      <div
        className={css`
          .ant-table-footer {
            padding: 0 !important;
          }
          .ant-formily-item-error-help {
            display: none;
          }
          .ant-description-textarea {
            line-height: 34px;
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
        `}
      >
        <FlagProvider isInSubTable>
          <CollectionRecordProvider record={null} parentRecord={recordV2}>
            <FormActiveFieldsProvider name="nester">
              <Table
                className={css`
                  .ant-formily-item.ant-formily-item-feedback-layout-loose {
                    margin-bottom: 0px !important;
                  }
                  .ant-formily-editable {
                    vertical-align: sub;
                  }
                  .ant-table-footer {
                    display: flex;
                  }
                `}
                bordered
                size={'small'}
                field={field}
                showIndex
                dragSort={field.editable}
                showDel={field.editable}
                pagination={false}
                rowSelection={{ type: 'none', hideSelectAll: true }}
                footer={() =>
                  field.editable && (
                    <>
                      {field.componentProps?.allowAddnew !== false && (
                        <Button
                          type={'text'}
                          block
                          className={css`
                            display: block;
                            border-radius: 0px;
                            border-right: 1px solid rgba(0, 0, 0, 0.06);
                          `}
                          onClick={() => {
                            field.value = field.value || [];
                            field.value.push(markRecordAsNew({}));
                            field.onInput(field.value);
                          }}
                        >
                          {t('Add new')}
                        </Button>
                      )}
                      {field.componentProps?.allowSelectExistingRecord && (
                        <Button
                          type={'text'}
                          block
                          className={css`
                            display: block;
                            border-radius: 0px;
                          `}
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
