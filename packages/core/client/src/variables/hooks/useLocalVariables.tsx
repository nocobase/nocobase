import { Form } from '@formily/core';
import { useMemo } from 'react';
import { useRecordV2 } from '../../application';
import { useFormBlockContext } from '../../block-provider';
import { useCollection } from '../../collection-manager';
import { getDateRanges } from '../../schema-component/antd/date-picker/util';
import { useBlockCollection } from '../../schema-settings/VariableInput/hooks/useBlockCollection';
import { useCurrentObjectVariable } from '../../schema-settings/VariableInput/hooks/useIterationVariable';
import { VariableOption } from '../types';

interface Props {
  collectionName?: string;
  currentForm?: Form;
}

const useLocalVariables = (props?: Props) => {
  const { name: currentCollectionName } = useCollection();
  const { currentObjectCtx, shouldDisplayCurrentObject } = useCurrentObjectVariable();
  let { name } = useBlockCollection();
  const currentRecord = useRecordV2(false);
  let { form } = useFormBlockContext();

  if (props?.currentForm) {
    form = props.currentForm;
  }

  if (props?.collectionName) {
    name = props.collectionName;
  }

  return useMemo(() => {
    const dateVars = getDateRanges();
    return (
      [
        /**
         * @deprecated
         * 兼容老版本
         */
        {
          name: 'currentRecord',
          ctx: currentRecord?.data,
          collectionName: currentRecord?.collectionName,
        },
        /**
         * @deprecated
         * 兼容旧版本的以数据表名称命名的变量，新版本已更名为 `$nForm`
         */
        {
          name,
          ctx: form?.values || currentRecord?.data,
          collectionName: name,
        },
        /**
         * @deprecated
         * 新版本已更名为 `$nForm`
         */
        {
          name: '$form',
          ctx: form?.values,
          collectionName: name,
        },
        {
          name: '$nRecord',
          ctx: currentRecord?.data,
          collectionName: currentRecord?.collectionName,
        },
        {
          name: '$nParentRecord',
          ctx: currentRecord?.parentRecord?.data,
          collectionName: currentRecord?.parentRecord?.collectionName,
        },
        {
          name: '$nForm',
          ctx: form?.values,
          collectionName: name,
        },
        {
          name: '$nDate',
          ctx: dateVars,
        },
        /**
         * @deprecated
         * 兼容旧版本的 `$date` 变量，新版本已弃用
         */
        {
          name: '$date',
          ctx: dateVars,
        },
        shouldDisplayCurrentObject && {
          name: '$iteration',
          ctx: currentObjectCtx,
          collectionName: currentCollectionName,
        },
      ] as VariableOption[]
    ).filter(Boolean);
  }, [currentRecord, name, form?.values, currentObjectCtx, currentCollectionName, shouldDisplayCurrentObject]); // 尽量保持返回的值不变，这样可以减少接口的请求次数，因为关系字段会缓存到变量的 ctx 中
};

export default useLocalVariables;
