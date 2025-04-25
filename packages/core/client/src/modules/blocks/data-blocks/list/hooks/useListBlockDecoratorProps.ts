/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useParentRecordCommon } from '../../../useParentRecordCommon';

export function useListBlockDecoratorProps(props) {
  let parentRecord;

  // 因为 association 的值是固定的，所以这里可以使用 hooks
  if (props.association) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    parentRecord = useParentRecordCommon(props.association);
  }

  return {
    parentRecord,
  };
}

export function useListBlockProps() {
  return {};
}
