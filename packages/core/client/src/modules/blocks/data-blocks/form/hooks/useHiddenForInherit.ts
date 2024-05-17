/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useIsDetailBlock } from '../../../../../block-provider/FormBlockProvider';
import { useCollection } from '../../../../../data-source/collection/CollectionProvider';
import { useRecord } from '../../../../../record-provider';
import { useDesignable } from '../../../../../schema-component/hooks/useDesignable';

/**
 * 用于在继承表的场景下，隐藏区块。
 * 具体文档：https://nocobase.feishu.cn/docx/A3L9dNZhnoMBjRxVciBcFzwLnae
 */
export const useHiddenForInherit = (props) => {
  const record = useRecord();
  const { collection, isCusomeizeCreate, hidden } = props;
  const { __collection } = record;
  const currentCollection = useCollection();
  const { designable } = useDesignable();
  const isDetailBlock = useIsDetailBlock();

  if (!currentCollection) {
    return {
      hidden: hidden || false,
    };
  }

  let detailFlag = false;
  if (isDetailBlock) {
    detailFlag = true;
    if (!designable && __collection) {
      detailFlag = __collection === collection;
    }
  }
  const createFlag =
    (currentCollection.name === (collection?.name || collection) && !isDetailBlock) ||
    !currentCollection.name ||
    !collection;

  return {
    hidden: hidden || (!detailFlag && !createFlag && !isCusomeizeCreate),
  };
};
