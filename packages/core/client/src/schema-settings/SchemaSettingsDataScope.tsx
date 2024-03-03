import { ISchema } from '@formily/react';
import React, { FC, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { DatePickerProvider, useCollectionManager_deprecated, useRecord } from '..';
import { useFormBlockContext } from '../block-provider';
import { useCollectionFilterOptionsV2 } from '../collection-manager/action-hooks';
import { FlagProvider, useFlag } from '../flag-provider';
import { DynamicComponentProps } from '../schema-component/antd/filter/DynamicComponent';
import { useLocalVariables, useVariables } from '../variables';
import { VariableInput, getShouldChange } from './VariableInput/VariableInput';
import { BaseVariableProvider, IsDisabledParams } from './VariableInput/hooks/useBaseVariable';
import { DataScopeProps } from './types';
import { SchemaSettingsModalItem } from './SchemaSettings';

export const SchemaSettingsDataScope: FC<DataScopeProps> = function DataScopeConfigure(props) {
  const { t } = useTranslation();
  const { getFields } = useCollectionFilterOptionsV2(props.collectionName);
  const record = useRecord();
  const { form } = useFormBlockContext();
  const variables = useVariables();
  const localVariables = useLocalVariables();
  const { getAllCollectionsInheritChain } = useCollectionManager_deprecated();
  const { isInSubForm, isInSubTable } = useFlag() || {};

  const dynamicComponent = useCallback(
    (props: DynamicComponentProps) => {
      return (
        <DatePickerProvider value={{ utc: false }}>
          <VariableInput
            {...props}
            form={form}
            record={record}
            shouldChange={getShouldChange({
              collectionField: props.collectionField,
              variables,
              localVariables,
              getAllCollectionsInheritChain,
            })}
          />
        </DatePickerProvider>
      );
    },
    [form, getAllCollectionsInheritChain, localVariables, record, variables],
  );

  const getSchema = () => {
    return {
      type: 'object',
      title: t('Set the data scope'),
      properties: {
        filter: {
          enum: props.collectionFilterOption || getFields(),
          'x-decorator': (props) => (
            <BaseVariableProvider {...props}>
              <FlagProvider isInSubForm={isInSubForm} isInSubTable={isInSubTable}>
                {props.children}
              </FlagProvider>
            </BaseVariableProvider>
          ),
          'x-decorator-props': {
            isDisabled,
          },
          'x-component': 'Filter',
          'x-component-props': {
            collectionName: props.collectionName,
            dynamicComponent: props.dynamicComponent || dynamicComponent,
          },
        },
      },
    };
  };

  return (
    <SchemaSettingsModalItem
      title={t('Set the data scope')}
      initialValues={{ filter: props.defaultFilter }}
      schema={getSchema as () => ISchema}
      onSubmit={props.onSubmit}
    />
  );
};

function isDisabled(params: IsDisabledParams) {
  const { option, collectionField, uiSchema } = params;

  if (!uiSchema || !collectionField) {
    return true;
  }

  // json 类型的字段，允许设置任意类型的值
  if (collectionField.interface === 'json') {
    return false;
  }

  // 数据范围支持选择 `对多` 、`对一` 的关系字段
  if (option.target) {
    return false;
  }

  if (['input', 'markdown', 'richText', 'textarea', 'username'].includes(collectionField.interface)) {
    return !['string', 'number'].includes(option.schema?.type);
  }

  if (collectionField.interface && option.interface) {
    return collectionField.interface !== option.interface;
  }

  if (uiSchema?.['x-component'] !== option.schema?.['x-component']) {
    return true;
  }

  return false;
}
