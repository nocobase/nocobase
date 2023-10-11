import { Field } from '@formily/core';
import { useField, useFieldSchema } from '@formily/react';
import _ from 'lodash';
import { useEffect } from 'react';
import { useRecord } from '../../../..';
import { useCollection, useCollectionManager } from '../../../../collection-manager';
import { useFlag } from '../../../../flag-provider';
import { useVariables } from '../../../../variables';
import { transformVariableValue } from '../../../../variables/utils/transformVariableValue';

/**
 * 用于懒加载 subForm 区块中的关系字段
 */
const useLazyLoadAssociationFieldOfSubForm = () => {
  const { name } = useCollection();
  const { getCollectionJoinField } = useCollectionManager();
  const record = useRecord();
  const fieldSchema = useFieldSchema();
  const variables = useVariables();
  const field = useField<Field>();
  const { isInAssignFieldValues } = useFlag() || {};

  const schemaName = fieldSchema.name.toString();

  useEffect(() => {
    if (isInAssignFieldValues) {
      return;
    }

    const collectionField = getCollectionJoinField(`${name}.${schemaName}`);

    if (!collectionField) {
      return;
    }

    const cloneRecord = { ...record };
    delete cloneRecord['__parent'];

    if (_.isEmpty(cloneRecord) || !variables || record[schemaName] != null) {
      return;
    }

    // 通过模拟一个 record 变量，用解析变量的方法去获取关系字段的值
    const recordVariable = {
      name: '$nRecord',
      ctx: cloneRecord,
      collectionName: name,
    };
    const variableString = `{{ $nRecord.${schemaName} }}`;

    variables
      .parseVariable(variableString, recordVariable)
      .then((value) => {
        field.value = transformVariableValue(value, { targetCollectionField: collectionField });
      })
      .catch((err) => {
        console.error(err);
      });
  }, [field, name, record, schemaName, isInAssignFieldValues]);
};

export default useLazyLoadAssociationFieldOfSubForm;
