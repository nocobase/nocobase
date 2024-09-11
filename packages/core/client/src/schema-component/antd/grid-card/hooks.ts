/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SpaceProps, theme } from 'antd';
import { useFieldSchema } from '@formily/react';
import { useDataBlockHeight } from '../../hooks/useBlockSize';
import { useDesignable } from '../../';
import { useDataBlockRequest } from '../../../data-source';

const spaceProps: SpaceProps = {
  size: ['large', 'small'],
  wrap: true,
};

export const useGridCardActionBarProps = () => {
  return {
    spaceProps,
  };
};

export const useGridCardBodyHeight = () => {
  const { token } = theme.useToken();
  const { designable } = useDesignable();
  const height = useDataBlockHeight();
  const schema = useFieldSchema();
  const hasActions = Object.keys(schema.parent.properties.actionBar?.properties || {}).length > 0;
  const { data } = useDataBlockRequest() || {};
  const { count, pageSize } = (data as any)?.meta || ({} as any);
  const hasPagination = count > pageSize;
  if (!height) {
    return;
  }

  const actionBarHeight = designable || hasActions ? token.controlHeight + 2 * token.paddingLG + token.marginLG : 0;
  const paginationHeight = hasPagination ? token.controlHeight + 2 * token.paddingLG + token.marginLG : 0;

  return height - actionBarHeight - paginationHeight;
};
