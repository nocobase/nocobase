import { Field } from '@formily/core';
import { useField, useFieldSchema } from '@formily/react';
import _ from 'lodash';
import { useEffect } from 'react';
import { useRecord } from '../../../..';
import { useCollection, useCollectionManager } from '../../../../collection-manager';
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

  const schemaName = fieldSchema.name.toString();

  useEffect(() => {
    const cloneRecord = { ...record };
    delete cloneRecord['__parent'];

    if (_.isEmpty(cloneRecord) || !variables || record[schemaName] != null) {
      return;
    }

    // 通过模拟一个 record 变量，用解析变量的方法去获取关系字段的值
    const recordVariable = {
      name: '$nRecord',
      ctx: record,
      collectionName: name,
    };
    const variableString = `{{ $nRecord.${schemaName} }}`;
    const collectionField = getCollectionJoinField(`${name}.${schemaName}`);

    if (process.env.NODE_ENV !== 'production') {
      if (!collectionField) {
        throw new Error(`useLazyLoadAssociationFieldOfSubForm: ${schemaName} not found in collection ${name}`);
      }
    }

    variables
      .parseVariable(variableString, recordVariable)
      .then((value) => {
        field.value = transformVariableValue(value, { targetCollectionFiled: collectionField });
      })
      .catch((err) => {
        console.error(err);
      });
  }, [field, name, record, schemaName]);
};

export default useLazyLoadAssociationFieldOfSubForm;
