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

export const useAssociationFilterHeight = () => {
  const height = useDataBlockHeight();
  const { token } = theme.useToken();
  return height - 2 * token.paddingLG;
};
