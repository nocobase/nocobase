/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useParentRecordCommon } from '@nocobase/client';
import { useCalendarBlockParams } from './useCalendarBlockParams';

export function useCalendarBlockDecoratorProps(props) {
  const { params, parseVariableLoading } = useCalendarBlockParams(props);
  let parentRecord;

  // 因为 association 是一个固定的值，所以可以在 hooks 中直接使用
  if (props.association) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    parentRecord = useParentRecordCommon(props.association);
  }

  return {
    params,
    parentRecord,
    /**
     * 为 true 则表示正在解析 filter 参数中的变量
     */
    parseVariableLoading,
  };
}
