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

export const useMapHeight = () => {
  const height = useDataBlockHeight();
  const { token } = theme.useToken();
  const { designable } = useDesignable();
  const { heightProps } = useBlockHeightProps() || {};
  const { title } = heightProps || {};
  const schema = useFieldSchema();
  if (!height) {
    return;
  }
  const hasMapAction = Object.keys(schema.parent?.properties.actions?.properties || {}).length > 0;
  const actionBarHeight =
    designable || hasMapAction ? token.paddingLG + token.controlHeight + token.margin : token.paddingLG + token.margin;
  const footerHeight = token.paddingLG;
  const blockTitleHeaderHeight = title ? token.fontSizeLG * token.lineHeightLG + token.padding * 2 - 1 : 0;
  return height - actionBarHeight - footerHeight - blockTitleHeaderHeight;
};
