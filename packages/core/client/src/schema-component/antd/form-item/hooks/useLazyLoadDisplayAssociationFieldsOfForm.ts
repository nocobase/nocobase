import { Field } from '@formily/core';
import { useField, useFieldSchema, useForm } from '@formily/react';
import { useEffect } from 'react';
import { useCollection, useCollectionManager } from '../../../../collection-manager';
import { useVariables } from '../../../../variables';
import { transformVariableValue } from '../../../../variables/utils/transformVariableValue';
import { useSubFormValue } from '../../association-field/hooks';

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

  const schemaName = fieldSchema.name.toString();
  const formValue = subFormValue || form.values;

  useEffect(() => {
    // 如果 schemaName 中是以 `.` 分割的，说明是一个关联字段，需要去获取关联字段的值；
    // 在数据表管理页面，也存在 `a.b` 之类的 schema name，其 collectionName 为 fields，所以在这里排除一下 `name === 'fields'` 的情况
    if (!schemaName.includes('.') || !variables || name === 'fields') {
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

    variables
      .parseVariable(variableString, formVariable)
      .then((value) => {
        field.value = transformVariableValue(value, { targetCollectionField: collectionField });
      })
      .catch((err) => {
        console.error(err);
      });
  }, [schemaName.includes('.') ? formValue[schemaName.split('.')[0]] : null]);
};

export default useLazyLoadDisplayAssociationFieldsOfForm;
