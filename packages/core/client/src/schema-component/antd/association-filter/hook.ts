/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { theme } from 'antd';
import { useDataBlockHeight } from '../../hooks/useBlockSize';
import { useBlockHeightProps } from '../../../block-provider';

export const useAssociationFilterHeight = () => {
  const height = useDataBlockHeight();
  const { token } = theme.useToken();
  const { heightProps } = useBlockHeightProps?.() || {};
  const { title } = heightProps || {};
  const blockTitleHeaderHeight = title ? token.fontSizeLG * token.lineHeightLG + token.padding * 2 - 1 : 0;
  return height - 2 * token.paddingLG - blockTitleHeaderHeight;
};
