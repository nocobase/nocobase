import { Field } from '@formily/core';
import { useField, useFieldSchema, useForm } from '@formily/react';
import { nextTick } from '@nocobase/utils/client';
import _ from 'lodash';
import { useEffect, useMemo, useRef } from 'react';
import { useAssociationNames } from '../../../../block-provider/hooks';
import { useCollectionManager_deprecated, useCollection_deprecated } from '../../../../collection-manager';
import { useCollectionRecordData } from '../../../../data-source/collection-record/CollectionRecordProvider';
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
  const { name } = useCollection_deprecated();
  const { getCollectionJoinField } = useCollectionManager_deprecated();
  const form = useForm();
  const recordData = useCollectionRecordData();
  const fieldSchema = useFieldSchema();
  const variables = useVariables();
  const field = useField<Field>();
  const { formValue: subFormValue } = useSubFormValue();
  const { isInSubForm, isInSubTable } = useFlag() || {};
  const { getAssociationAppends } = useAssociationNames();

  const schemaName = fieldSchema.name.toString();
  const formValue = _.cloneDeep(isInSubForm || isInSubTable ? subFormValue : form.values);
  const collectionFieldRef = useRef(null);
  const sourceCollectionFieldRef = useRef(null);

  // 是否已经预加载了数据（通过 appends 的形式）
  const hasPreloadData = useMemo(() => hasPreload(recordData, schemaName), [recordData, schemaName]);

  if (collectionFieldRef.current == null && isDisplayField(schemaName)) {
    collectionFieldRef.current = getCollectionJoinField(`${name}.${schemaName}`);
  }
  if (sourceCollectionFieldRef.current == null && isDisplayField(schemaName)) {
    sourceCollectionFieldRef.current = getCollectionJoinField(`${name}.${schemaName.split('.')[0]}`);
  }

  const sourceKeyValue =
    isDisplayField(schemaName) && sourceCollectionFieldRef.current
      ? _.get(formValue, `${schemaName.split('.')[0]}.${sourceCollectionFieldRef.current?.targetKey || 'id'}`)
      : undefined;

  useEffect(() => {
    // 如果 schemaName 中是以 `.` 分割的，说明是一个关联字段，需要去获取关联字段的值；
    // 在数据表管理页面，也存在 `a.b` 之类的 schema name，其 collectionName 为 fields，所以在这里排除一下 `name === 'fields'` 的情况
    if (
      !isDisplayField(schemaName) ||
      !variables ||
      name === 'fields' ||
      !collectionFieldRef.current ||
      hasPreloadData
    ) {
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
    if (sourceKeyValue == null) {
      return;
    }

    const { appends } = getAssociationAppends();

    variables
      .parseVariable(variableString, formVariable, { appends })
      .then((value) => {
        nextTick(() => {
          const result = transformVariableValue(value, { targetCollectionField: collectionFieldRef.current });
          // fix https://nocobase.height.app/T-2608
          if (_.isEmpty(result) && !_.isNumber(result)) {
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

/**
 * 数据是否已被预加载
 * @param record
 * @param path
 * @returns
 */
function hasPreload(record: Record<string, any>, path: string) {
  const value = _.get(record, path);
  return value != null && JSON.stringify(value) !== '[{}]' && JSON.stringify(value) !== '{}';
}
