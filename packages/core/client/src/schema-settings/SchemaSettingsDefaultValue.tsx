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
import { useFormBlockContext, useTableBlockContext } from '../block-provider';
import { useCollectionFilterOptionsV2 } from '../collection-manager/action-hooks';
import { FlagProvider, useFlag } from '../flag-provider';
import { useLocalVariables, useVariables } from '../variables';
import { isVariable } from '../variables/utils/isVariable';
import { VariableInput, getShouldChange } from './VariableInput/VariableInput';
import { Option } from './VariableInput/type';
import { formatVariableScop } from './VariableInput/utils/formatVariableScop';
import {
  findParentFieldSchema,
  defaultInputStyle,
  getFieldDefaultValue,
  SchemaSettingsModalItem,
} from './SchemaSettings';
import { ArrayCollapse, FormLayout } from '@formily/antd-v5';

export const SchemaSettingsDefaultValue = function DefaultValueConfigure(props: { fieldSchema?: Schema }) {
  const currentSchema = useFieldSchema();
  const fieldSchema = props?.fieldSchema ?? currentSchema;
  const field: Field = useField();
  const { dn } = useDesignable();
  const { t } = useTranslation();
  const actionCtx = useActionContext();
  let targetField;

  const { getField } = useCollection_deprecated();
  const { getCollectionJoinField, getCollectionFields, getAllCollectionsInheritChain } =
    useCollectionManager_deprecated();
  const variables = useVariables();
  const localVariables = useLocalVariables();
  const collection = useCollection_deprecated();
  const record = useRecord();
  const { form } = useFormBlockContext();
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
    actionCtx?.fieldSchema?.['x-action'] === 'customize:create' &&
    (collectionField?.interface === 'm2m' ||
      (parentCollectionField?.type === 'hasMany' && collectionField?.interface === 'm2o'));

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
      VariableInput: (props) => {
        return (
          <FlagProvider isInSubForm={isInSubForm} isInSubTable={isInSubTable} isInSetDefaultValueDialog>
            <VariableInput {...props} />
          </FlagProvider>
        );
      },
    };
  }, [isInSubForm, isInSubTable]);

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
            contextCollectionName: isAllowContextVariable && tableCtx.collection,
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
              const s = _.cloneDeep(fieldSchemaWithoutRequired) || ({} as Schema);
              s.title = '';
              s.name = 'default';
              s['x-read-pretty'] = false;
              s['x-disabled'] = false;

              const defaultValue = getFieldDefaultValue(s, collectionField);

              if (collectionField.target && s['x-component-props']) {
                s['x-component-props'].mode = 'Select';
              }

              if (collectionField?.uiSchema.type) {
                s.type = collectionField.uiSchema.type;
              }

              if (collectionField?.uiSchema['x-component'] === 'Checkbox') {
                s['x-component-props'].defaultChecked = defaultValue;

                // 在这里如果不设置 type 为 void，会导致设置的默认值不生效
                // 但是我不知道为什么必须要设置为 void ？
                s.type = 'void';
              }

              const schema = {
                ...(s || {}),
                'x-decorator': 'FormItem',
                'x-component-props': {
                  ...s['x-component-props'],
                  collectionName: collectionField?.collectionName,
                  targetField,
                  onChange: props.onChange,
                  defaultValue: isVariable(defaultValue) ? '' : defaultValue,
                  style: {
                    width: '100%',
                    verticalAlign: 'top',
                    minWidth: '200px',
                  },
                },
                default: isVariable(defaultValue) ? '' : defaultValue,
              } as ISchema;

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
      fieldSchema.default = v.default;
      if (!v.default && v.default !== 0) {
        field.value = null;
      }
      schema.default = v.default;
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
    />
  );
};
