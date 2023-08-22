import { Form } from '@formily/core';
import { ISchema } from '@formily/react';
import _ from 'lodash';
import { useMemo } from 'react';
import { CollectionFieldOptions } from '../../../collection-manager';
import { isVariable } from '../../../variables/utils/isVariable';
import { Option } from '../type';
import { useDateVariable } from './useDateVariable';
import { useFormVariable } from './useFormVariable';
import { useIterationVariable } from './useIterationVariable';
import { useRecordVariable } from './useRecordVariable';
import { useUserVariable } from './useUserVariable';

interface Props {
  /**
   * 消费该变量的字段
   */
  collectionField: CollectionFieldOptions;
  blockCollectionName: string;
  form: Form;
  /**
   * `useRecord` 返回的值
   */
  record: Record<string, any>;
  /**
   * `Filter` 组件中选中的字段的 `uiSchema`，比如设置 `数据范围` 的时候在左侧选择的字段
   */
  uiSchema?: ISchema;
  /**
   * `Filter` 组件中的操作符，比如设置 `数据范围` 的时候在中间选择的操作符
   */
  operator?: { value: string };
}

export const useVariableOptions = ({
  collectionField,
  blockCollectionName: rootCollection,
  form,
  record,
  uiSchema,
  operator,
}: Props) => {
  const fieldCollectionName = collectionField?.collectionName;
  const userVariable = useUserVariable({ maxDepth: 3, uiSchema: uiSchema, collectionField });
  const dateVariable = useDateVariable({ operator, schema: uiSchema });
  const formVariable = useFormVariable({ schema: uiSchema, collectionName: rootCollection, collectionField });
  const iterationVariable = useIterationVariable({
    currentCollection: fieldCollectionName,
    collectionField,
    schema: uiSchema,
  });
  const currentRecordVariable = useRecordVariable({
    schema: uiSchema,
    collectionName: rootCollection,
    collectionField,
  });

  // 保证下面的 `_.isEmpty(record)` 结果符合预期，如果存在 `__parent` 字段，需要删除
  record = { ...record };
  delete record.__parent;

  return useMemo(() => {
    return [
      userVariable,
      dateVariable,
      form && !form.readPretty && formVariable,
      form && fieldCollectionName && rootCollection && fieldCollectionName !== rootCollection && iterationVariable,
      !_.isEmpty(record) && currentRecordVariable,
    ].filter(Boolean);
  }, [
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
    const formVariable = variables.find((item) => item.value === '$nForm');
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
    const formVariable = variables.find((item) => item.value === '$nRecord');
    if (formVariable) {
      formVariable.value = 'currentRecord';
    }
  }

  if (value.includes('currentTime')) {
    variables.push(currentTime);
  }

  if (value.includes('$date')) {
    const formVariable = variables.find((item) => item.value === '$nDate');
    if (formVariable) {
      formVariable.value = '$date';
    }
  }

  return variables;
};
