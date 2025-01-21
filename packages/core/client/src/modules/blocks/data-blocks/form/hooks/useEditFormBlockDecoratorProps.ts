/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useParamsFromRecord } from '../../../../../block-provider/BlockProvider';
import { useDetailsParentRecord } from '../../details-single/hooks/useDetailsDecoratorProps';
import { useHiddenForInherit } from './useHiddenForInherit';

export function useEditFormBlockDecoratorProps(props) {
  const params = useFormBlockParams(props);
  let parentRecord;
  const { hidden } = useHiddenForInherit(props);

  // association 的值是固定不变的，所以这里可以使用 hooks
  if (props.association) {
    // 复用详情区块的 sourceId 获取逻辑
    // eslint-disable-next-line react-hooks/rules-of-hooks
    parentRecord = useDetailsParentRecord(props.association);
  }

  return {
    params,
    parentRecord,
    hidden,
  };
}

function useFormBlockParams(props) {
  return useParamsFromRecord(props);
}
