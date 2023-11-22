import { Field } from '@formily/core';
import { useField, useFieldSchema, useForm } from '@formily/react';
import { nextTick } from '@nocobase/utils/client';
import _ from 'lodash';
import { useEffect, useRef } from 'react';
import { useCollection, useCollectionManager } from '../../../../collection-manager';
import { useFlag } from '../../../../flag-provider';
import { useVariables } from '../../../../variables';
import { transformVariableValue } from '../../../../variables/utils/transformVariableValue';
import { useSubFormValue } from '../../association-field/hooks';
import { isDisplayField } from '../utils';

/**
 * 用于懒加载 Form 区块中只用于展示的关联字段的值
 *
 * - 在表单区块中，有一个 Display association fields 的选项，这里面的字段，只是为了显示出相应的值，不可更改
 * - 这里就是加载这些字段值的地方
 */
const useLazyLoadDisplayAssociationFieldsOfForm = () => {
  const { name } = useCollection();
  const { getCollectionJoinField } = useCollectionManager();
  const form = useForm();
  const fieldSchema = useFieldSchema();
  const variables = useVariables();
  const field = useField<Field>();
  const { formValue: subFormValue } = useSubFormValue();
  const { isInSubForm, isInSubTable } = useFlag() || {};

  const schemaName = fieldSchema.name.toString();
  const formValue = _.cloneDeep(isInSubForm || isInSubTable ? subFormValue : form.values);
  const collectionFieldRef = useRef(null);

  if (collectionFieldRef.current == null) {
    collectionFieldRef.current = getCollectionJoinField(`${name}.${schemaName}`);
  }

  const sourceKeyValue =
    isDisplayField(schemaName) && collectionFieldRef.current
      ? _.get(formValue, `${schemaName.split('.')[0]}.${collectionFieldRef.current.sourceKey}`)
      : undefined;

  useEffect(() => {
    // 如果 schemaName 中是以 `.` 分割的，说明是一个关联字段，需要去获取关联字段的值；
    // 在数据表管理页面，也存在 `a.b` 之类的 schema name，其 collectionName 为 fields，所以在这里排除一下 `name === 'fields'` 的情况
    if (!isDisplayField(schemaName) || !variables || name === 'fields' || !collectionFieldRef.current) {
      return;
    }

    if (_.isEmpty(formValue)) {
      return;
    }

    const formVariable = {
      name: '$nForm',
      ctx: formValue,
      collectionName: name,
    };
    const variableString = `{{ $nForm.${schemaName} }}`;

    // 如果关系字段的 id 为空，则说明请求的数据还没有返回，此时还不能去解析变量
    if (sourceKeyValue === undefined) {
      return;
    }

    variables
      .parseVariable(variableString, formVariable)
      .then((value) => {
        nextTick(() => {
          const result = transformVariableValue(value, { targetCollectionField: collectionFieldRef.current });
          // fix https://nocobase.height.app/T-2608
          if (_.isEmpty(result)) {
            field.value = null;
          } else {
            field.value = result;
          }
        });
      })
      .catch((err) => {
        console.error(err);
      });
  }, [sourceKeyValue]);
};

export default useLazyLoadDisplayAssociationFieldsOfForm;
