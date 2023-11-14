import { Field } from '@formily/core';
import { useField, useFieldSchema, useForm } from '@formily/react';
import _ from 'lodash';
import { useEffect, useRef } from 'react';
import { useCollection, useCollectionManager } from '../../../../collection-manager';
import { useFlag } from '../../../../flag-provider';
import { useRecord } from '../../../../record-provider';
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
  const record = useRecord();
  // 用于重新运行 useEffect 的标记
  const refreshTagRef = useRef(0);

  const schemaName = fieldSchema.name.toString();
  const formValue = isInSubForm || isInSubTable ? subFormValue : form.values;

  useEffect(() => {
    // 如果 schemaName 中是以 `.` 分割的，说明是一个关联字段，需要去获取关联字段的值；
    // 在数据表管理页面，也存在 `a.b` 之类的 schema name，其 collectionName 为 fields，所以在这里排除一下 `name === 'fields'` 的情况
    if (!isDisplayField(schemaName) || !variables || name === 'fields') {
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
    const collectionField = getCollectionJoinField(`${name}.${schemaName}`);

    if (!collectionField) {
      return console.error(new Error(`useLazyLoadAssociationField: ${schemaName} not found in collection ${name}`));
    }

    // 如果关系字段的 id 为空，则说明请求的数据还没有返回，此时还不能去解析变量
    if (_.get(formValue, `${schemaName.split('.')[0]}.${collectionField.sourceKey}`) === undefined) {
      // 确保 useEffect 会重新运行一次，防止关系数据没有被加载的情况
      refreshTagRef.current++;
      return;
    }

    variables
      .parseVariable(variableString, formVariable)
      .then((value) => {
        field.value = transformVariableValue(value, { targetCollectionField: collectionField });
      })
      .catch((err) => {
        console.error(err);
      });

    // 这里的依赖不要动，动了会出 BUG
  }, [schemaName.includes('.') ? formValue[schemaName.split('.')[0]] : null, record, refreshTagRef.current]);
};

export default useLazyLoadDisplayAssociationFieldsOfForm;
