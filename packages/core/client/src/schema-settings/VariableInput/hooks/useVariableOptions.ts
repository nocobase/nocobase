import { Form } from '@formily/core';
import _ from 'lodash';
import { useMemo } from 'react';
import { CollectionFieldOptions } from '../../../collection-manager';
import { useValues } from '../../../schema-component/antd/filter/useValues';
import { isVariable } from '../../../variables/utils/isVariable';
import { Option } from '../type';
import { useDateVariable } from './useDateVariable';
import { useFormVariable } from './useFormVariable';
import { useIterationVariable } from './useIterationVariable';
import { useRecordVariable } from './useRecordVariable';
import { useUserVariable } from './useUserVariable';

interface Props {
  collectionField: CollectionFieldOptions;
  blockCollectionName: string;
  form: Form;
  /**
   * `useRecord` 返回的值
   */
  record: Record<string, any>;
}

export const useVariableOptions = ({ collectionField, blockCollectionName: rootCollection, form, record }: Props) => {
  const fieldCollectionName = collectionField?.collectionName;
  const { operator, schema = collectionField?.uiSchema } = useValues();
  const userVariable = useUserVariable({ maxDepth: 3, schema });
  const dateVariable = useDateVariable({ operator, schema });
  const formVariable = useFormVariable({ schema, collectionName: rootCollection, form });
  const iterationVariable = useIterationVariable({
    currentCollection: fieldCollectionName,
    schema,
    form,
  });
  const currentRecordVariable = useRecordVariable({ schema, collectionName: rootCollection });

  const result = useMemo(() => {
    if (!schema) return [];

    return [
      userVariable,
      dateVariable,
      form && formVariable,
      form && fieldCollectionName && rootCollection && fieldCollectionName !== rootCollection && iterationVariable,
      !_.isEmpty(record) && currentRecordVariable,
    ].filter(Boolean);
  }, [
    schema,
    userVariable,
    dateVariable,
    form,
    formVariable,
    fieldCollectionName,
    rootCollection,
    iterationVariable,
    record,
    currentRecordVariable,
  ]);

  return result;
};

/**
 * 兼容老版本的变量
 * @param variables
 */
export const compatOldVariables = (variables: Option[], { value, collectionName, t }) => {
  if (!isVariable(value)) {
    return variables;
  }

  variables = _.cloneDeep(variables);

  const systemVariable: Option = {
    value: '$system',
    key: '$system',
    label: t('System variables'),
    isLeaf: false,
    children: [
      {
        value: 'now',
        key: 'now',
        label: t('Current time'),
        isLeaf: true,
        depth: 1,
      },
    ],
    depth: 0,
  };
  const currentTime = {
    value: 'currentTime',
    label: t('Current time'),
    children: null,
  };

  if (value.includes('$system')) {
    variables.push(systemVariable);
  }

  if (value.includes(`${collectionName}.`)) {
    const formVariable = variables.find((item) => item.value === '$form');
    if (formVariable) {
      formVariable.value = collectionName;
    }
  }

  if (value.includes('currentUser')) {
    const userVariable = variables.find((item) => item.value === '$user');
    if (userVariable) {
      userVariable.value = 'currentUser';
    }
  }

  if (value.includes('currentRecord')) {
    const formVariable = variables.find((item) => item.value === '$form');
    if (formVariable) {
      formVariable.value = 'currentRecord';
    }
  }

  if (value.includes('currentTime')) {
    variables.push(currentTime);
  }

  return variables;
};
