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
import { useDesignable } from '../../../';
import { useListBlockContext } from './List.Decorator';

const spaceProps: SpaceProps = {
  size: ['large', 'small'],
  wrap: true,
};

export const useListActionBarProps = () => {
  return {
    spaceProps,
  };
};

import { useDataBlockHeight } from '../../hooks/useBlockSize';

export const useListBlockHeight = () => {
  const height = useDataBlockHeight();
  const schema = useFieldSchema();
  const { token } = theme.useToken();
  const { designable } = useDesignable();
  const {
    service: { data },
  } = useListBlockContext() || {};
  const { count, pageSize } = (data as any)?.meta || ({} as any);
  const hasPagination = count > pageSize;

  if (!height) {
    return;
  }
  const hasListActions = Object.keys(schema.parent.properties.actionBar?.properties || {}).length > 0;
  const actionBarHeight = hasListActions || designable ? token.controlHeight + 2 * token.marginLG : token.marginLG;
  const paginationHeight = hasPagination ? token.controlHeight + token.paddingLG + token.marginLG : token.marginLG;
  return height - actionBarHeight - paginationHeight;
};
