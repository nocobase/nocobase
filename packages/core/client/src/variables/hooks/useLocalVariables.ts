import { Form } from '@formily/core';
import { useMemo } from 'react';
import { useFormBlockContext } from '../../block-provider';
import { useCollection } from '../../collection-manager';
import { useRecord } from '../../record-provider';
import { VariableOption } from '../types';

interface Props {
  collectionName?: string;
  currentRecord?: Record<string, any>;
  form?: Form;
}

const useLocalVariables = (props?: Props) => {
  let { name } = useCollection();
  let currentRecord = useRecord();
  let { form } = useFormBlockContext();

  if (props?.form) {
    form = props.form;
  }
  if (props?.currentRecord) {
    currentRecord = props.currentRecord;
  }
  if (props?.collectionName) {
    name = props.collectionName;
  }

  return useMemo(() => {
    return [
      // 兼容老版本
      {
        name: 'currentRecord',
        ctx: currentRecord,
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
        ctx: currentRecord,
        collectionName: name,
      },
      {
        name: '$nForm',
        ctx: form?.values,
        collectionName: name,
      },
    ] as VariableOption[];
  }, [JSON.stringify(currentRecord), JSON.stringify(form?.values || {}), name]); // 尽量保持返回的值不变，这样可以减少接口的请求次数，因为关系字段会缓存到变量的 ctx 中
};

export default useLocalVariables;
