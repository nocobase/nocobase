/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import { onFieldInputValueChange } from '@formily/core';
import { connect, mapProps, observer, useField, useFieldSchema, useForm } from '@formily/react';
import { uid } from '@formily/shared';
import { Space, message } from 'antd';
import { isEqual } from 'lodash';
import { isFunction } from 'mathjs';
import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ClearCollectionFieldContext,
  NocoBaseRecursionField,
  RecordProvider,
  SchemaComponentContext,
  useAPIClient,
  useCollectionManager_deprecated,
  useCollectionRecordData,
} from '../../../';
import { VariablePopupRecordProvider } from '../../../modules/variable/variablesProvider/VariablePopupRecordProvider';
import { isVariable } from '../../../variables/utils/isVariable';
import { getInnermostKeyAndValue } from '../../common/utils/uitls';
import { Action } from '../action';
import { RemoteSelect, RemoteSelectProps } from '../remote-select';
import useServiceOptions, { useAssociationFieldContext } from './hooks';

const removeIfKeyEmpty = (obj, filterTargetKey) => {
  if (!obj || typeof obj !== 'object' || !filterTargetKey || Array.isArray(obj)) return obj;
  return !obj[filterTargetKey] ? undefined : obj;
};

export const AssociationFieldAddNewer = (props) => {
  const schemaComponentCtxValue = useContext(SchemaComponentContext);
  return (
    <SchemaComponentContext.Provider value={{ ...schemaComponentCtxValue, draggable: true }}>
      <Action.Container {...props} />
    </SchemaComponentContext.Provider>
  );
};

export type AssociationSelectProps<P = any> = RemoteSelectProps<P> & {
  addMode?: 'quickAdd' | 'modalAdd';
  action?: string;
  multiple?: boolean;
};

export const filterAnalyses = (filters): any[] => {
  if (!filters) {
    return;
  }
  const type = Object.keys(filters)[0] || '$and';
  const conditions = filters[type];
  const results = [];
  conditions?.map((c) => {
    const jsonlogic = getInnermostKeyAndValue(c);
    const operator = jsonlogic?.key;

    if (!operator) {
      return true;
    }
    const regex = /\{\{\$[a-zA-Z_]\w*(?:\.[a-zA-Z_]\w*)*\.(\w+)\.id\}\}/;
    const fieldName = jsonlogic?.value?.match?.(regex)?.[1];
    if (fieldName) {
      results.push(fieldName);
    }
  });
  return results;
};

function getFieldPath(str) {
  const lastIndex = str.lastIndexOf('.');
  return lastIndex === -1 ? str : str.slice(0, lastIndex);
}

const InternalAssociationSelect = observer(
  (props: AssociationSelectProps) => {
    const { objectValue = true, addMode: propsAddMode, ...rest } = props;
    const field: any = useField();
    const fieldSchema = useFieldSchema();
    const service = useServiceOptions(fieldSchema?.['x-component-props'] || props);
    const { options: collectionField } = useAssociationFieldContext();
    const initValue = isVariable(props.value) ? undefined : props.value;
    const value = Array.isArray(initValue) ? initValue.filter(Boolean) : initValue;
    // 因为通过 Schema 的形式书写的组件，在值变更的时候 `value` 的值没有改变，所以需要维护一个 `innerValue` 来变更值
    const [innerValue, setInnerValue] = useState(value);
    const addMode = fieldSchema['x-component-props']?.addMode;
    const { t } = useTranslation();
    const { multiple } = props;
    const form = useForm();
    const api = useAPIClient();
    const resource = api.resource(collectionField.target);
    const recordData = useCollectionRecordData();
    const schemaComponentCtxValue = useContext(SchemaComponentContext);
    const { getCollection } = useCollectionManager_deprecated();
    const associationCollection = getCollection(collectionField.target);
    const { filterTargetKey } = associationCollection;

    useEffect(() => {
      const initValue = isVariable(field.value) ? undefined : field.value;
      const value = Array.isArray(initValue) ? initValue.filter(Boolean) : initValue;
      const result = removeIfKeyEmpty(value, filterTargetKey);
      setInnerValue(result);
      if (!isEqual(field.value, result)) {
        field.value = result;
      }
    }, [field.value, filterTargetKey]);

    useEffect(() => {
      const id = uid();
      form.addEffects(id, () => {
        //支持深层次子表单
        onFieldInputValueChange('*', (fieldPath: any) => {
          const linkageFields = filterAnalyses(field.componentProps?.service?.params?.filter) || [];
          const linageFieldEntire = getFieldPath(fieldPath.address.entire);
          const targetFieldEntire = getFieldPath(field.address.entire);
          if (
            linkageFields.includes(fieldPath?.props?.name) &&
            field.value &&
            isEqual(fieldPath?.indexes, field?.indexes) &&
            fieldPath?.props?.name !== field.props.name &&
            (!field?.indexes?.length || isEqual(linageFieldEntire, targetFieldEntire))
          ) {
            field.setValue(null);
            setInnerValue(null);
          }
        });
      });

      return () => {
        form.removeEffects(id);
      };
    }, []);

    const handleCreateAction = async (props) => {
      const { search: value, callBack } = props;
      const {
        data: { data },
      } = await resource.create({
        values: {
          [field?.componentProps?.fieldNames?.label || 'id']: value,
        },
      });
      if (data) {
        if (['m2m', 'o2m'].includes(collectionField?.interface) && multiple !== false) {
          const values = form.getValuesIn(field.path) || [];
          values.push(data);
          form.setValuesIn(field.path, values);
          field.onInput(values);
        } else {
          form.setValuesIn(field.path, data);
          field.onInput(data);
        }
        isFunction(callBack) && callBack?.();
        message.success(t('Saved successfully'));
      }
    };
    const QuickAddContent = (props) => {
      return (
        <div
          onClick={() => handleCreateAction(props)}
          style={{ cursor: 'pointer', padding: '5px 12px', color: '#0d0c0c' }}
        >
          <PlusOutlined />
          <span style={{ paddingLeft: 5 }}>{t('Add') + ` “${props.search}” `}</span>
        </div>
      );
    };
    return (
      <div key={fieldSchema.name}>
        <Space.Compact style={{ display: 'flex' }}>
          <RemoteSelect
            style={{ width: '100%' }}
            {...rest}
            size={'middle'}
            objectValue={objectValue}
            value={removeIfKeyEmpty(value || innerValue, filterTargetKey)}
            service={service}
            onChange={(value) => {
              const val = Array.isArray(value) && value.length === 0 ? null : value;
              props.onChange?.(val);
            }}
            CustomDropdownRender={addMode === 'quickAdd' && QuickAddContent}
          ></RemoteSelect>

          {addMode === 'modalAdd' && (
            <SchemaComponentContext.Provider value={{ ...schemaComponentCtxValue, draggable: false }}>
              <RecordProvider isNew={true} record={null} parent={recordData}>
                <VariablePopupRecordProvider>
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
                </VariablePopupRecordProvider>
              </RecordProvider>
            </SchemaComponentContext.Provider>
          )}
        </Space.Compact>
      </div>
    );
  },
  { displayName: 'AssociationSelect' },
);

interface AssociationSelectInterface {
  (props: any): React.ReactElement;
  Designer: React.FC;
  FilterDesigner: React.FC;
}

export const AssociationSelect = InternalAssociationSelect as unknown as AssociationSelectInterface;

export const AssociationSelectReadPretty = connect(
  (props: any) => {
    const service = useServiceOptions(props);
    if (props.fieldNames) {
      return <RemoteSelect.ReadPretty {...props} service={service}></RemoteSelect.ReadPretty>;
    }
    return null;
  },
  mapProps(
    {
      dataSource: 'options',
      loading: true,
    },
    (props, field) => {
      return {
        ...props,
        fieldNames: props.fieldNames && { ...props.fieldNames, ...field.componentProps.fieldNames },
        suffixIcon: field?.['loading'] || field?.['validating'] ? <LoadingOutlined /> : props.suffixIcon,
      };
    },
  ),
);
