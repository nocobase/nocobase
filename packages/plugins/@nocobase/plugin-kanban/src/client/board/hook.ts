/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useDataBlockHeight, useDesignable, useBlockHeightProps } from '@nocobase/client';
import { theme } from 'antd';
import { useFieldSchema } from '@formily/react';

export const useKanbanBlockHeight = () => {
  const { heightProps } = useBlockHeightProps();
  const { title } = heightProps;
  const height = useDataBlockHeight();
  const { token } = theme.useToken();
  const { designable } = useDesignable();
  const schema = useFieldSchema();
  if (!height) {
    return;
  }
  const hasKanbanActions = Object.keys(schema.parent.properties.actions?.properties || {}).length > 0;
  const actionBarHeight =
    hasKanbanActions || designable ? token.controlHeight + 2 * token.marginLG : 1 * token.marginLG;
  const kanbanHeaderHeight = 2 * token.padding + token.lineHeightSM * token.fontSizeSM + 3;

  const blockTitleHeaderHeight = title ? token.fontSizeLG * token.lineHeightLG + token.padding * 2 - 1 : 0;

  const footerHeight = token.controlPaddingHorizontal + token.margin + token.paddingLG - token.marginXS;
  return height - actionBarHeight - kanbanHeaderHeight - footerHeight - blockTitleHeaderHeight;
};
