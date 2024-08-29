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
import { RecursionField, connect, mapProps, observer, useField, useFieldSchema, useForm } from '@formily/react';
import { uid } from '@formily/shared';
import { Space, message } from 'antd';
import { isFunction } from 'mathjs';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ClearCollectionFieldContext, RecordProvider, useAPIClient, useCollectionRecordData } from '../../../';
import { isVariable } from '../../../variables/utils/isVariable';
import { getInnermostKeyAndValue } from '../../common/utils/uitls';
import { RemoteSelect, RemoteSelectProps } from '../remote-select';
import useServiceOptions, { useAssociationFieldContext } from './hooks';

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
    useEffect(() => {
      const initValue = isVariable(field.value) ? undefined : field.value;
      const value = Array.isArray(initValue) ? initValue.filter(Boolean) : initValue;
      setInnerValue(value);
    }, [field.value]);
    useEffect(() => {
      const id = uid();
      form.addEffects(id, () => {
        //支持深层次子表单
        onFieldInputValueChange('*', (fieldPath: any) => {
          const linkageFields = filterAnalyses(field.componentProps?.service?.params?.filter) || [];
          if (linkageFields.includes(fieldPath?.props?.name) && field.value) {
            field.setValue(undefined);
            setInnerValue(undefined);
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
            value={value || innerValue}
            service={service}
            onChange={(value) => {
              const val = value?.length !== 0 ? value : null;
              props.onChange?.(val);
            }}
            CustomDropdownRender={addMode === 'quickAdd' && QuickAddContent}
          ></RemoteSelect>

          {addMode === 'modalAdd' && (
            <RecordProvider isNew={true} record={null} parent={recordData}>
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
