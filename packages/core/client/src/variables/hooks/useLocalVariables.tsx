import { Form } from '@formily/core';
import { useMemo } from 'react';
import { useCollection_deprecated } from '../../collection-manager';
import { useBlockCollection } from '../../schema-settings/VariableInput/hooks/useBlockCollection';
import { useDatetimeVariable } from '../../schema-settings/VariableInput/hooks/useDateVariable';
import { useCurrentFormVariable } from '../../schema-settings/VariableInput/hooks/useFormVariable';
import { useCurrentObjectVariable } from '../../schema-settings/VariableInput/hooks/useIterationVariable';
import { useCurrentParentRecordVariable } from '../../schema-settings/VariableInput/hooks/useParentRecordVariable';
import { useCurrentRecordVariable } from '../../schema-settings/VariableInput/hooks/useRecordVariable';
import { VariableOption } from '../types';

interface Props {
  collectionName?: string;
  currentForm?: Form;
}

const useLocalVariables = (props?: Props) => {
  const { currentObjectCtx, shouldDisplayCurrentObject } = useCurrentObjectVariable();
  const { currentRecordCtx, collectionName: collectionNameOfRecord } = useCurrentRecordVariable();
  const { currentParentRecordCtx, collectionName: collectionNameOfParentRecord } = useCurrentParentRecordVariable();
  const { datetimeCtx } = useDatetimeVariable();
  const { currentFormCtx } = useCurrentFormVariable({ form: props?.currentForm });
  const { name: currentCollectionName } = useCollection_deprecated();
  let { name } = useBlockCollection();

  if (props?.collectionName) {
    name = props.collectionName;
  }

  return useMemo(() => {
    return (
      [
        /**
         * @deprecated
         * 兼容老版本
         */
        {
          name: 'currentRecord',
          ctx: currentRecordCtx,
          collectionName: collectionNameOfRecord,
        },
        /**
         * @deprecated
         * 兼容旧版本的以数据表名称命名的变量，新版本已更名为 `$nForm`
         */
        {
          name,
          ctx: currentFormCtx || currentRecordCtx,
          collectionName: name,
        },
        /**
         * @deprecated
         * 新版本已更名为 `$nForm`
         */
        {
          name: '$form',
          ctx: currentFormCtx,
          collectionName: name,
        },
        {
          name: '$nRecord',
          ctx: currentRecordCtx,
          collectionName: collectionNameOfRecord,
        },
        {
          name: '$nParentRecord',
          ctx: currentParentRecordCtx,
          collectionName: collectionNameOfParentRecord,
        },
        {
          name: '$nForm',
          ctx: currentFormCtx,
          collectionName: name,
        },
        {
          name: '$nDate',
          ctx: datetimeCtx,
        },
        /**
         * @deprecated
         * 兼容旧版本的 `$date` 变量，新版本已弃用
         */
        {
          name: '$date',
          ctx: datetimeCtx,
        },
        shouldDisplayCurrentObject && {
          name: '$iteration',
          ctx: currentObjectCtx,
          collectionName: currentCollectionName,
        },
      ] as VariableOption[]
    ).filter(Boolean);
  }, [
    currentRecordCtx,
    collectionNameOfRecord,
    name,
    currentFormCtx,
    currentParentRecordCtx,
    collectionNameOfParentRecord,
    datetimeCtx,
    shouldDisplayCurrentObject,
    currentObjectCtx,
    currentCollectionName,
  ]); // 尽量保持返回的值不变，这样可以减少接口的请求次数，因为关系字段会缓存到变量的 ctx 中
};

export default useLocalVariables;
