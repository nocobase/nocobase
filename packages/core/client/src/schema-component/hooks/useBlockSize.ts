/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useEventListener } from 'ahooks';
import { debounce } from 'lodash';
import { useCallback, useRef, useState } from 'react';
import { theme } from 'antd';
import { useDesignable } from '..';
import { useDataBlock } from '../../data-source';
import { useFieldSchema } from '@formily/react';

// 页面中满屏
const usePageFullScreenHeight = () => {
  const { token } = theme.useToken();
  const { designable } = useDesignable();
  const { heightProps } = useDataBlock();
  const { disablePageHeader } = heightProps;
  const navHeight = token.sizeXXL - 2;
  const addBlockBtnHeight = designable
    ? token.controlHeight + 3 * token.paddingContentHorizontalLG
    : 2 * token.paddingContentHorizontalLG;
  const pageHeaderHeight = disablePageHeader
    ? token.paddingContentHorizontalLG
    : token.controlHeight + token.marginXS + (token.paddingXXS + 2) * 2 + token.paddingContentHorizontalLG;
  console.log('navHeight', navHeight);
  console.log('pageHeaderHeight', pageHeaderHeight);
  console.log('addBlockBtnHeight', addBlockBtnHeight);
  return navHeight + pageHeaderHeight + addBlockBtnHeight;
};
// 表格区块高度计算
const useTableHeight = () => {
  const { token } = theme.useToken();
  const { heightProps } = useDataBlock();
  const { designable } = useDesignable();
  const schema = useFieldSchema();
  const pageFullScreenHeight = usePageFullScreenHeight();
  const { heightMode, height, title } = heightProps;
  if (!heightProps?.heightMode || heightMode === 'adaptive') {
    return;
  }
  const hasTableActions = Object.keys(schema.parent.properties.actions?.properties || {}).length > 0;
  const paginationHeight = token.controlHeight + token.padding + token.marginLG;
  const actionBarHeight = hasTableActions || designable ? token.controlHeight + 2 * token.marginLG : token.marginLG;
  const tableHeaderHeight = (designable ? token.controlHeight : 22) + 2 * token.padding + 1;
  const blockHeaderHeight = title ? token.fontSizeLG * token.lineHeightLG + token.padding * 2 - 1 : 0;

  // console.log('blockHeaderHeight', blockHeaderHeight);
  // console.log('actionBarHeight', actionBarHeight);
  // console.log('tableHeaderHeight', tableHeaderHeight);
  // console.log('paginationHeight', paginationHeight);

  if (heightMode === 'fullScreen') {
    return (
      window.innerHeight -
      pageFullScreenHeight -
      blockHeaderHeight -
      tableHeaderHeight -
      actionBarHeight -
      paginationHeight
    );
  }
  return height - blockHeaderHeight - actionBarHeight - tableHeaderHeight - paginationHeight;
};

// 常规区块高度计算
export const useDataBlockHeight = () => {
  const { heightProps } = useDataBlock();
  const pageFullScreenHeight = usePageFullScreenHeight();
  const { heightMode, height } = heightProps;

  if (!heightProps?.heightMode || heightMode === 'adaptive') {
    return;
  }
  if (heightMode === 'fullScreen') {
    return window.innerHeight - pageFullScreenHeight;
  }
  return height;
};
export const useTableSize = () => {
  const [height, setTableHeight] = useState(0);
  const [width, setTableWidth] = useState(0);
  const elementRef = useRef<HTMLDivElement>(null);
  const targetHeight = useTableHeight();
  console.log(targetHeight);

  const calcTableSize = useCallback(
    debounce(() => {
      if (!elementRef.current) return;
      const clientRect = elementRef.current.getBoundingClientRect();
      const tableContentRect = elementRef.current.querySelector('.ant-table')?.getBoundingClientRect();
      if (!tableContentRect) return;
      setTableWidth(clientRect.width);
      setTableHeight(targetHeight);
    }, 100),
    [targetHeight],
  );

  const tableSizeRefCallback: React.RefCallback<HTMLDivElement> = useCallback(
    (ref) => {
      elementRef.current = ref && ref.children ? (ref.children[0] as HTMLDivElement) : null;
      calcTableSize();
    },
    [calcTableSize],
  );

  useEventListener('resize', calcTableSize);

  return { height, width, tableSizeRefCallback };
};
