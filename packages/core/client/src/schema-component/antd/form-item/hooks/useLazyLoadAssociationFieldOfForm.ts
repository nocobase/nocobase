import { Field } from '@formily/core';
import { useField, useFieldSchema } from '@formily/react';
import _ from 'lodash';
import { useEffect } from 'react';
import { useFormBlockType, useRecord } from '../../../..';
import { useCollection, useCollectionManager } from '../../../../collection-manager';
import { useFlag } from '../../../../flag-provider';
import { useVariables } from '../../../../variables';
import { transformVariableValue } from '../../../../variables/utils/transformVariableValue';
import { isDisplayField, isFieldValueEmpty } from '../utils';

/**
 * 用于懒加载 Form 区块中正常的关系字段
 *
 * - 当 record 中缺少对应的字段值时，通过解析变量的方法去获取关系字段的值
 * - 注意：应该只有在编辑模式下运行，创建模式下直接返回
 */
const useLazyLoadAssociationFieldOfForm = () => {
  const { name } = useCollection();
  const { getCollectionJoinField } = useCollectionManager();
  const record = useRecord();
  const fieldSchema = useFieldSchema();
  const variables = useVariables();
  const field = useField<Field>();
  const { isInAssignFieldValues, isInSubForm, isInSubTable } = useFlag() || {};
  const { type: formBlockType } = useFormBlockType();

  const schemaName = fieldSchema.name.toString();

  useEffect(() => {
    const cloneRecord = { ...record };
    delete cloneRecord['__parent'];
    delete cloneRecord['__collectionName'];

    if (
      isInAssignFieldValues ||
      _.isEmpty(cloneRecord) ||
      (formBlockType === 'create' && !isInSubForm && !isInSubTable) ||
      isDisplayField(schemaName)
    ) {
      return;
    }

    const collectionField = getCollectionJoinField(`${name}.${schemaName}`);

    if (!collectionField) {
      return;
    }

    if (!variables || !isFieldValueEmpty(_.get(record, schemaName))) {
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
        // fix https://nocobase.height.app/T-2288
        // 造成这个问题的原因有以下几点：
        // 1. 编辑表单自身会请求数据，并在请求数据时，会在 appends 参数中加上所有的关系字段路径（包括子表单中的）；
        // 2. 而 `变量预加载中` 也会请求对应关系字段的数据，但是请求的数据是不包含子表单中的关系字段的；
        // 3. 所以，当 `变量预加载` 的请求晚于编辑表单的请求时，就会造成这个问题；
        // 更优的解决方案是：在 `变量预加载` 中也加上子表单中的关系字段路径，并删除编辑表单请求数据的逻辑（因为没必要了）。
        // 但是这样改动较大，可以等之后 e2e 测试较完备后再处理。
        if (!isFieldValueEmpty(field.value)) {
          return;
        }

        field.value = transformVariableValue(value, { targetCollectionField: collectionField });
      })
      .catch((err) => {
        console.error(err);
      });
  }, [record]);
};

export default useLazyLoadAssociationFieldOfForm;
