/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useDataBlockProps } from '../..';
import { useDataBlockParentRecord } from '../../block-provider/hooks/useDataBlockParentRecord';
import { useSourceKey } from './useSourceKey';

export const useSourceId = () => {
  const { sourceId, association } = useDataBlockProps() || {};
  const sourceKey = useSourceKey(association);
  const sourceRecord = useDataBlockParentRecord({ association });

  if (sourceId) {
    return sourceId;
  }

  return sourceRecord?.[sourceKey];
};
