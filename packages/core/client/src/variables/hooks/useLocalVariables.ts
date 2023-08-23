import { Form } from '@formily/core';
import _ from 'lodash';
import { useMemo } from 'react';
import { useFormBlockContext } from '../../block-provider';
import { useCollection } from '../../collection-manager';
import { useRecord } from '../../record-provider';
import { useBlockCollection } from '../../schema-settings/VariableInput/hooks/useBlockCollection';
import { VariableOption } from '../types';

interface Props {
  collectionName?: string;
  currentRecord?: Record<string, any>;
  currentForm?: Form;
}

const useLocalVariables = (props?: Props) => {
  const { name: currentCollectionName } = useCollection();
  let { name } = useBlockCollection();
  let currentRecord = useRecord();
  let { form } = useFormBlockContext();

  if (props?.currentForm) {
    form = props.currentForm;
  }
  if (props?.currentRecord) {
    currentRecord = props.currentRecord;
  }
  if (props?.collectionName) {
    name = props.collectionName;
  }

  let blockRecord = currentRecord;
  // 获取到最顶层的 record，即当前区块所在的 record
  while (!_.isEmpty(blockRecord.__parent)) {
    blockRecord = blockRecord.__parent;
  }

  return useMemo(() => {
    return [
      // 兼容老版本
      {
        name: 'currentRecord',
        ctx: blockRecord,
        collectionName: name,
      },
      // 兼容旧版本的以数据表名称命名的变量，新版本已更名为 `$nForm`
      {
        name,
        ctx: form?.values,
        collectionName: name,
      },
      {
        name: '$nRecord',
        ctx: blockRecord,
        collectionName: name,
      },
      {
        name: '$nForm',
        ctx: form?.values,
        collectionName: name,
      },
      { name: '$iteration', ctx: currentRecord, collectionName: currentCollectionName },
    ] as VariableOption[];
  }, [JSON.stringify(currentRecord), JSON.stringify(form?.values || {}), name]); // 尽量保持返回的值不变，这样可以减少接口的请求次数，因为关系字段会缓存到变量的 ctx 中
};

export default useLocalVariables;
