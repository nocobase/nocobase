/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

// refer to packages/core/client/src/schema-component/antd/form-v2/hook.ts
import { useDataBlockHeight, useBlockHeightProps, useFormDataTemplates, useDesignable } from '@nocobase/client';
import { theme } from 'antd';

export default function useHeight() {
  const height = useDataBlockHeight();
  const { token } = theme.useToken();
  const { designable } = useDesignable();
  const { heightProps } = useBlockHeightProps() || {};
  const { title, titleHeight } = heightProps || {};
  const { display, enabled } = useFormDataTemplates();

  if (typeof height !== 'number') return;

  const isFormBlock = true;
  const actionBarHeight = designable
    ? token.controlHeight + (isFormBlock ? 1 : 2) * token.marginLG
    : token.marginLG + token.controlHeight;
  const blockTitleHeaderHeight = title ? titleHeight || 0 : 0;
  const paginationHeight = 0;
  const dataTemplateHeight = display && enabled ? token.controlHeight + 2 * token.padding + token.margin : 0;
  const stepHeight = 76;
  const nextHeight =
    height -
    actionBarHeight -
    token.paddingLG -
    blockTitleHeaderHeight -
    paginationHeight -
    dataTemplateHeight -
    stepHeight;
  return Number.isFinite(nextHeight) ? nextHeight : undefined;
}
