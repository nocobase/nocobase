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
  }, [currentRecord, form?.values, name]);
};

export default useLocalVariables;
