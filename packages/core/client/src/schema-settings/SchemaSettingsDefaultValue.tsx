/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ArrayCollapse, FormLayout } from '@formily/antd-v5';
import { Field } from '@formily/core';
import { ISchema, Schema, useField, useFieldSchema } from '@formily/react';
import _ from 'lodash';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FormProvider,
  SchemaComponent,
  useActionContext,
  useCollectionManager_deprecated,
  useCollection_deprecated,
  useDesignable,
  useRecord,
} from '..';
import { useFormBlockContext } from '../block-provider/FormBlockProvider';
import { useTableBlockContext } from '../block-provider/TableBlockProvider';
import { useCollectionFilterOptionsV2 } from '../collection-manager/action-hooks';
import { FlagProvider, useFlag } from '../flag-provider';
import { useLocalVariables, useVariables } from '../variables';
import { isVariable } from '../variables/utils/isVariable';
import {
  SchemaSettingsModalItem,
  defaultInputStyle,
  findParentFieldSchema,
  getFieldDefaultValue,
} from './SchemaSettings';
import { VariableInput, getShouldChange } from './VariableInput/VariableInput';
import { Option } from './VariableInput/type';
import { formatVariableScop } from './VariableInput/utils/formatVariableScop';

const getActionContext = (context: { fieldSchema?: Schema }) => {
  const actionCtx = (context.fieldSchema?.['x-action-context'] || {}) as { collection?: string; dataSource?: string };
  return actionCtx;
};

export const SchemaSettingsDefaultValue = function DefaultValueConfigure(props: {
  fieldSchema?: Schema;
  hideVariableButton?: boolean;
}) {
  const currentSchema = useFieldSchema();
  const fieldSchema = props?.fieldSchema ?? currentSchema;
  const field: Field = useField();
  const { dn } = useDesignable();
  const { t } = useTranslation();
  const actionCtx = useActionContext();
  const actionCollection = getActionContext(actionCtx).collection;

  let targetField;

  const { getField } = useCollection_deprecated();
  const { getCollectionJoinField, getCollectionFields, getAllCollectionsInheritChain } =
    useCollectionManager_deprecated();
  const variables = useVariables();
  const localVariables = useLocalVariables();
  const collection = useCollection_deprecated();
  const record = useRecord();
  const { form, type } = useFormBlockContext();
  const { getFields } = useCollectionFilterOptionsV2(collection);
  const { isInSubForm, isInSubTable } = useFlag() || {};

  const { name } = collection;
  const collectionField = useMemo(
    () => getField(fieldSchema['name']) || getCollectionJoinField(fieldSchema['x-collection-field']),
    [fieldSchema, getCollectionJoinField, getField],
  );
  const fieldSchemaWithoutRequired = _.omit(fieldSchema, 'required');
  if (collectionField?.target) {
    targetField = getCollectionJoinField(
      `${collectionField.target}.${fieldSchema['x-component-props']?.fieldNames?.label || 'id'}`,
    );
  }

  const parentFieldSchema = collectionField?.interface === 'm2o' && findParentFieldSchema(fieldSchema);
  const parentCollectionField = parentFieldSchema && getCollectionJoinField(parentFieldSchema?.['x-collection-field']);
  const tableCtx = useTableBlockContext();
  const isAllowContextVariable =
    collectionField?.interface === 'm2m' ||
    collectionField?.interface === 'mbm' ||
    (parentCollectionField?.type === 'hasMany' && collectionField?.interface === 'm2o');

  const returnScope = useCallback(
    (scope: Option[]) => {
      const currentForm = scope.find((item) => item.value === '$nForm');
      const fields = getCollectionFields(name);

      // fix https://nocobase.height.app/T-1355
      // 工作流人工节点的 `自定义表单` 区块，与其它表单区块不同，根据它的数据表名称，获取到的字段列表为空，所以需要在这里特殊处理一下
      if (!fields?.length && currentForm) {
        currentForm.children = formatVariableScop(getFields());
      }

      return scope;
    },
    [getFields, name],
  );

  const DefaultValueComponent: any = useMemo(() => {
    return {
      ArrayCollapse,
      FormLayout,
      VariableInput: (inputProps) => {
        return (
          <VariableInput
            {...inputProps}
            value={inputProps.value || undefined}
            hideVariableButton={props?.hideVariableButton}
          />
        );
      },
    };
  }, []);

  const schema = useMemo(() => {
    return {
      type: 'object',
      title: t('Set default value'),
      properties: {
        default: {
          'x-decorator': 'FormItem',
          'x-component': 'VariableInput',
          'x-component-props': {
            ...(fieldSchema?.['x-component-props'] || {}),
            collectionField,
            contextCollectionName: isAllowContextVariable ? actionCollection : '',
            schema: collectionField?.uiSchema,
            targetFieldSchema: fieldSchema,
            className: defaultInputStyle,
            form,
            record,
            returnScope,
            shouldChange: getShouldChange({
              collectionField,
              variables,
              localVariables,
              getAllCollectionsInheritChain,
            }),
            renderSchemaComponent: function Com(props) {
              const clonedSchema = useMemo(() => _.cloneDeep(fieldSchemaWithoutRequired) || ({} as Schema), []);
              clonedSchema['x-read-pretty'] = false;
              clonedSchema['x-disabled'] = false;
              _.set(clonedSchema, 'x-decorator-props.showTitle', false);

              const defaultValue = getFieldDefaultValue(clonedSchema, collectionField);

              if (collectionField.target && clonedSchema['x-component-props']) {
                clonedSchema['x-component-props'].mode = 'Select';
              }

              if (collectionField?.uiSchema.type) {
                clonedSchema.type = collectionField.uiSchema.type;
              }

              if (collectionField?.uiSchema['x-component'] === 'Checkbox') {
                _.set(clonedSchema, 'x-component-props.defaultChecked', defaultValue);

                // 在这里如果不设置 type 为 void，会导致设置的默认值不生效
                // 但是我不知道为什么必须要设置为 void ？
                clonedSchema.type = 'void';
              }

              const schema = useMemo(
                () =>
                  ({
                    ...(clonedSchema || {}),
                    'x-decorator': 'FormItem',
                    'x-component-props': {
                      ...clonedSchema['x-component-props'],
                      collectionName: collectionField?.collectionName,
                      targetField,
                      defaultValue: isVariable(defaultValue) ? '' : defaultValue,
                      style: {
                        width: '100%',
                        verticalAlign: 'top',
                        minWidth: '200px',
                      },
                    },
                    default: isVariable(defaultValue) ? '' : defaultValue,
                  }) as ISchema,
                [clonedSchema, defaultValue],
              );

              // the props.onChange's value is dynamic, so we can't use useMemo to wrap it
              _.set(schema, 'x-component-props.onChange', props.onChange);

              return (
                <FormProvider>
                  <SchemaComponent schema={schema} />
                </FormProvider>
              );
            },
          },
          title: t('Default value'),
          default: getFieldDefaultValue(fieldSchema, collectionField),
        },
      },
    } as ISchema;
  }, [
    collectionField,
    fieldSchema,
    fieldSchemaWithoutRequired,
    form,
    getAllCollectionsInheritChain,
    isAllowContextVariable,
    localVariables,
    record,
    returnScope,
    t,
    tableCtx.collection,
    targetField,
    variables,
  ]);
  const handleSubmit: (values: any) => void = useCallback(
    (v) => {
      const schema: ISchema = {
        ['x-uid']: fieldSchema['x-uid'],
      };
      fieldSchema.default = v.default ?? null;
      if (!isVariable(v.default)) {
        (record.__isNewRecord__ || type === 'create') && field.setInitialValue?.(v.default);
      }
      schema.default = v.default ?? null;
      dn.emit('patch', {
        schema,
        currentSchema,
      });
    },
    [currentSchema, dn, field, fieldSchema],
  );
  return (
    <SchemaSettingsModalItem
      title={t('Set default value')}
      components={DefaultValueComponent}
      width={800}
      schema={schema}
      onSubmit={handleSubmit}
      ModalContextProvider={(props: any) => {
        return (
          <FlagProvider
            isInSubForm={isInSubForm}
            isInSubTable={isInSubTable}
            isInSetDefaultValueDialog
            collectionField={collectionField}
          >
            {props.children}
          </FlagProvider>
        );
      }}
    />
  );
};
