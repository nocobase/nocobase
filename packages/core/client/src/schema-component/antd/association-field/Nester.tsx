/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CloseOutlined, PlusOutlined, ZoomInOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { ArrayField } from '@formily/core';
import { spliceArrayState } from '@formily/core/esm/shared/internals';
import { observer, useFieldSchema } from '@formily/react';
import { action } from '@formily/reactive';
import { each } from '@formily/shared';
import { transformMultiColumnToSingleColumn } from '@nocobase/utils/client';
import { useUpdate } from 'ahooks';
import { Button, Card, Divider, Space, Tooltip } from 'antd';
import React, { useCallback, useContext, useMemo, useState } from 'react';
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
import { CollectionProvider, useCollection } from '../../../data-source';
import {
  useCollectionRecord,
  useCollectionRecordData,
} from '../../../data-source/collection-record/CollectionRecordProvider';
import { isNewRecord, markRecordAsNew } from '../../../data-source/collection-record/isNewRecord';
import { FlagProvider } from '../../../flag-provider';
import {
  NocoBaseRecursionField,
  RefreshComponentProvider,
  useRefreshComponent,
} from '../../../formily/NocoBaseRecursionField';
import { RecordIndexProvider, RecordProvider } from '../../../record-provider';
import { useMobileLayout } from '../../../route-switch/antd/admin-layout';
import { isPatternDisabled, isSystemField } from '../../../schema-settings';
import {
  DefaultValueProvider,
  IsAllowToSetDefaultValueParams,
  interfacesOfUnsupportedDefaultValue,
} from '../../../schema-settings/hooks/useIsAllowToSetDefaultValue';
import { useCompile } from '../../hooks';
import { Action, ActionContextProvider } from '../action';
import { AssociationFieldContext } from './context';
import { SubFormProvider, useAssociationFieldContext, useFieldNames } from './hooks';
import { useTableSelectorProps } from './InternalPicker';
import { getLabelFormatValue, useLabelUiSchema } from './util';

export const Nester = (props) => {
  const { options } = useContext(AssociationFieldContext);
  if (['hasOne', 'belongsTo'].includes(options.type)) {
    return (
      <FlagProvider isInSubForm>
        <ToOneNester {...props} />
      </FlagProvider>
    );
  }
  if (['hasMany', 'belongsToMany', 'belongsToArray'].includes(options.type)) {
    return (
      <FlagProvider isInSubForm>
        <ToManyNester {...props} />
      </FlagProvider>
    );
  }
  return null;
};

const ToOneNester = (props) => {
  const { field } = useAssociationFieldContext<ArrayField>();
  const recordV2 = useCollectionRecord();
  const collection = useCollection();
  const fieldSchema = useFieldSchema();

  const isAllowToSetDefaultValue = useCallback(
    ({ form, fieldSchema, collectionField, getInterface, formBlockType }: IsAllowToSetDefaultValueParams) => {
      if (!collectionField) {
        if (process.env.NODE_ENV !== 'production') {
          console.error(`collectionField should not be ${collectionField}`);
        }
        return false;
      }

      // 当 Field component 不是下列组件时，不允许设置默认值
      if (
        collectionField.target &&
        fieldSchema['x-component-props']?.mode &&
        !['Picker', 'Select'].includes(fieldSchema['x-component-props'].mode)
      ) {
        return false;
      }

      // hasOne 和 belongsTo 类型的字段只能有一个值，不会新增值，所以在编辑状态下不允许设置默认值
      if (formBlockType === 'update') {
        return false;
      }

      return (
        !form?.readPretty &&
        !isPatternDisabled(fieldSchema) &&
        !interfacesOfUnsupportedDefaultValue.includes(collectionField?.interface) &&
        !isSystemField(collectionField, getInterface)
      );
    },
    [],
  );

  return (
    <FormActiveFieldsProvider name="nester">
      <SubFormProvider value={{ value: field.value, collection, fieldSchema: fieldSchema.parent }}>
        <RecordProvider isNew={recordV2?.isNew} record={field.value} parent={recordV2?.data}>
          <DefaultValueProvider isAllowToSetDefaultValue={isAllowToSetDefaultValue}>
            <Card bordered={true}>{props.children}</Card>
          </DefaultValueProvider>
        </RecordProvider>
      </SubFormProvider>
    </FormActiveFieldsProvider>
  );
};

const ToManyNester = observer(
  (props: any) => {
    const fieldSchema = useFieldSchema();
    const {
      options: collectionField,
      field,
      allowMultiple,
      allowDissociate,
      currentMode,
    } = useAssociationFieldContext<ArrayField>();
    const { allowSelectExistingRecord } = field.componentProps;
    const { t } = useTranslation();
    const recordData = useCollectionRecordData();
    const collection = useCollection();
    const update = useUpdate();
    const { isMobileLayout } = useMobileLayout();

    const newSchema = useMemo(
      () => (isMobileLayout ? transformMultiColumnToSingleColumn(fieldSchema) : fieldSchema),
      [isMobileLayout, fieldSchema],
    );
    const newParentSchema = useMemo(
      () => (isMobileLayout ? transformMultiColumnToSingleColumn(fieldSchema.parent) : fieldSchema.parent),
      [isMobileLayout, fieldSchema.parent],
    );

    const refreshComponent = useRefreshComponent();
    const refresh = useCallback(() => {
      update();
      refreshComponent?.();
    }, [update, refreshComponent]);

    const [visibleSelector, setVisibleSelector] = useState(false);
    const [selectedRows, setSelectedRows] = useState([]);
    const fieldNames = useFieldNames(props);
    const compile = useCompile();
    const labelUiSchema = useLabelUiSchema(collectionField, fieldNames?.label || 'label');
    const useNesterSelectProps = () => {
      return {
        run() {
          setVisibleSelector(true);
        },
      };
    };
    if (!Array.isArray(field.value)) {
      field.value = [];
    }

    const isAllowToSetDefaultValue = useCallback(({ form, fieldSchema, collectionField, getInterface }) => {
      if (!collectionField) {
        if (process.env.NODE_ENV !== 'production') {
          console.error(`collectionField should not be ${collectionField}`);
        }
        return false;
      }

      // 当 Field component 不是下列组件时，不允许设置默认值
      if (
        collectionField.target &&
        fieldSchema['x-component-props']?.mode &&
        !['Picker', 'Select'].includes(fieldSchema['x-component-props'].mode)
      ) {
        return false;
      }

      return (
        !form?.readPretty &&
        !isPatternDisabled(fieldSchema) &&
        !interfacesOfUnsupportedDefaultValue.includes(collectionField?.interface) &&
        !isSystemField(collectionField, getInterface)
      );
    }, []);

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
        },
      };
    };
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
    const getFilter = () => {
      const targetKey = collectionField?.targetKey || 'id';
      const list = (field.value || []).map((option) => option?.[targetKey]).filter(Boolean);
      const filter = list.length ? { $and: [{ [`${targetKey}.$ne`]: list }] } : {};
      return filter;
    };

    return field.value.length > 0 ? (
      <Card
        bordered={true}
        style={{ position: 'relative' }}
        className={css`
          > .ant-card-body > .ant-divider:last-child {
            display: none;
          }
        `}
      >
        <RefreshComponentProvider refresh={refresh}>
          {field.value.map((value, index) => {
            let allowed = allowDissociate;
            if (!allowDissociate) {
              allowed = !value?.[collectionField.targetKey];
            }
            return (
              <React.Fragment key={index}>
                <div style={{ textAlign: 'right' }}>
                  {!field.readPretty && allowed && (!fieldSchema['x-template-uid'] || index > 0) && (
                    <Tooltip key={'remove'} title={t('Remove')}>
                      <CloseOutlined
                        style={{ zIndex: 1000, color: '#a8a3a3' }}
                        onClick={() => {
                          action(() => {
                            spliceArrayState(field as any, {
                              startIndex: index,
                              deleteCount: 1,
                            });
                            field.value.splice(index, 1);
                            if (Array.isArray(field.initialValue)) {
                              field.initialValue.splice(index, 1);
                            }
                            return field.onInput(field.value);
                          });
                        }}
                      />
                    </Tooltip>
                  )}
                </div>
                <FormActiveFieldsProvider name="nester">
                  <SubFormProvider value={{ value, collection, fieldSchema: fieldSchema.parent }}>
                    <RecordProvider isNew={isNewRecord(value)} record={value} parent={recordData}>
                      <RecordIndexProvider index={index}>
                        <DefaultValueProvider isAllowToSetDefaultValue={isAllowToSetDefaultValue}>
                          <NocoBaseRecursionField
                            onlyRenderProperties
                            basePath={field.address.concat(index)}
                            schema={newSchema}
                          />
                        </DefaultValueProvider>
                      </RecordIndexProvider>
                    </RecordProvider>
                  </SubFormProvider>
                </FormActiveFieldsProvider>

                <Divider />
              </React.Fragment>
            );
          })}
          <Space>
            {field.editable && allowMultiple && (
              <Action.Link
                useProps={() => {
                  return {
                    onClick: () => {
                      action(() => {
                        if (!Array.isArray(field.value)) {
                          field.value = [];
                        }
                        const index = field.value.length;
                        field.value.splice(index, 0, markRecordAsNew({}));
                        each(field.form.fields, (targetField, key) => {
                          if (!targetField) {
                            delete field.form.fields[key];
                          }
                        });
                        return field.onInput(field.value);
                      });
                    },
                  };
                }}
                title={
                  <Space style={{ gap: 2 }} className="nb-sub-form-addNew">
                    <PlusOutlined /> {t('Add new')}
                  </Space>
                }
              />
            )}
            {field.editable && allowSelectExistingRecord && currentMode === 'Nester' && allowMultiple && (
              <Action.Link
                useAction={useNesterSelectProps}
                title={
                  <Space style={{ gap: 2 }}>
                    <ZoomInOutlined /> {t('Select record')}
                  </Space>
                }
              />
            )}
          </Space>
        </RefreshComponentProvider>
        <ActionContextProvider
          value={{
            openSize: 'middle',
            openMode: 'drawer',
            visible: visibleSelector,
            setVisible: setVisibleSelector,
          }}
        >
          <RecordPickerProvider {...pickerProps}>
            <CollectionProvider name={collectionField?.target}>
              <FormProvider>
                <TableSelectorParamsProvider params={{ filter: getFilter() }}>
                  <SchemaComponentOptions
                    scope={{
                      usePickActionProps,
                      useTableSelectorProps,
                      useCreateActionProps,
                    }}
                  >
                    <NocoBaseRecursionField
                      onlyRenderProperties
                      basePath={field.address}
                      schema={newParentSchema}
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
      </Card>
    ) : (
      <>
        {field.editable && allowMultiple && (
          <Tooltip key={'add'} title={t('Add new')}>
            <Button
              type={'default'}
              className={css`
                border: 1px solid #f0f0f0 !important;
                box-shadow: none;
              `}
              block
              icon={<PlusOutlined />}
              onClick={() => {
                const result = field.value;
                result.push(markRecordAsNew({}));
                field.value = result;
              }}
            ></Button>
          </Tooltip>
        )}
      </>
    );
  },
  { displayName: 'ToManyNester' },
);
