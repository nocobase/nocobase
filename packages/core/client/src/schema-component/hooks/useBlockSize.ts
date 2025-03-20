/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFieldSchema } from '@formily/react';
import { useEventListener } from 'ahooks';
import { theme } from 'antd';
import { debounce } from 'lodash';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useDesignable } from '..';
import { useCollection } from '../../';
import { getPageSchema, useBlockHeightProps } from '../../block-provider/hooks';
import { useTableBlockContext } from '../../block-provider/TableBlockProvider';
import { HeightMode } from '../../schema-settings/SchemaSettingsBlockHeightItem';

const getPageHeaderHeight = (disablePageHeader, enablePageTabs, hidePageTitle, token, pathname) => {
  if (pathname.includes('/popups/')) {
    return 2 * token.paddingContentVertical + 22 + token.paddingPageVertical;
  }
  if (disablePageHeader) {
    return token.paddingContentHorizontalLG;
  } else {
    if (!hidePageTitle) {
      if (enablePageTabs) {
        return (
          token.paddingSM +
          token.controlHeight +
          token.marginXS +
          2 * token.controlPaddingHorizontalSM +
          22 +
          token.paddingContentHorizontalLG
        );
      }
      return (
        token.controlHeight + token.marginXS + (token.paddingContentVertical + 2) * 2 + token.paddingContentHorizontalLG
      );
    } else {
      if (enablePageTabs) {
        return (
          token.controlPaddingHorizontal + 3 * token.controlPaddingHorizontalSM + 22 + token.paddingContentHorizontalLG
        );
      }
      return token.paddingContentHorizontalLG + 12;
    }
  }
};

// 页面中满屏
const usePageFullScreenHeight = (props?) => {
  const { token } = theme.useToken();
  const { designable } = useDesignable();
  const { heightProps } = useBlockHeightProps();
  const location = useLocation();
  const { disablePageHeader, enablePageTabs, hidePageTitle } = props || heightProps || {};
  const navHeight = token.sizeXXL - 2;
  const addBlockBtnHeight = designable
    ? token.controlHeight + 2 * token.paddingContentHorizontalLG
    : 1 * token.paddingContentHorizontalLG;
  const pageHeaderHeight = getPageHeaderHeight(
    disablePageHeader,
    enablePageTabs,
    hidePageTitle,
    token,
    location.pathname,
  );
  return navHeight + pageHeaderHeight + addBlockBtnHeight;
};

// 抽屉中满屏
const useDrawerFullScreenHeight = () => {
  const { token } = theme.useToken();
  const { designable } = useDesignable();
  const tabActionHeight = token.paddingContentVerticalLG + token.margin + 2 * token.paddingContentVertical + 24;
  const addBlockBtnHeight = designable
    ? token.controlHeight + 2 * token.paddingContentHorizontalLG
    : 1 * token.paddingContentHorizontalLG;
  return tabActionHeight + addBlockBtnHeight;
};

//满屏
const useFullScreenHeight = (props?) => {
  const schema = useFieldSchema();
  const isDrawerBlock = hasActionContainerInParentChain(schema);
  const pageReservedHeight = usePageFullScreenHeight(props);
  const drawerReservedHeight = useDrawerFullScreenHeight();
  if (isDrawerBlock) {
    return drawerReservedHeight;
  }
  return pageReservedHeight;
};

const InternalWorkflowCollection = ['workflowManualTasks', 'approvals', 'approvalRecords'];
// 表格区块高度计算
const useTableHeight = () => {
  const { token } = theme.useToken();
  const { heightProps: blockHeightProps } = useBlockHeightProps();
  const { heightProps: tableHeightProps } = useTableBlockContext();
  const { designable } = useDesignable();
  const schema = useFieldSchema();
  const heightProps = tableHeightProps || blockHeightProps;
  const { titleHeight } = blockHeightProps;
  const pageFullScreenHeight = useFullScreenHeight(heightProps);
  const { name } = useCollection();
  const { heightMode, height, title } = heightProps;
  if (!heightProps?.heightMode || heightMode === HeightMode.DEFAULT) {
    return;
  }
  const hasTableActions = Object.keys(schema.parent.properties.actions?.properties || {}).length > 0;
  const paginationHeight = token.controlHeight + token.padding + token.marginLG;
  const actionBarHeight = hasTableActions || designable ? token.controlHeight + 2 * token.marginLG : token.marginLG;
  const tableHeaderHeight =
    (designable && !InternalWorkflowCollection.includes(name) ? token.controlHeight : 22) + 2 * token.padding + 1;
  const blockHeaderHeight = title ? titleHeight : 0;
  if (heightMode === HeightMode.FULL_HEIGHT) {
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

// 常规数据区块高度计算
interface UseDataBlockHeightOptions {
  removeBlockHeaderHeight?: boolean;
  innerExtraHeight?: number;
}
export const useDataBlockHeight = (options?: UseDataBlockHeightOptions) => {
  const { heightProps } = useBlockHeightProps();
  const pageFullScreenHeight = useFullScreenHeight();

  const { heightMode, height, title, titleHeight } = heightProps || {};

  const blockHeaderHeight = title ? titleHeight : 0;

  if (!heightProps?.heightMode || heightMode === HeightMode.DEFAULT) {
    return;
  }
  if (heightMode === HeightMode.FULL_HEIGHT) {
    let res = window.innerHeight - pageFullScreenHeight;
    if (options?.removeBlockHeaderHeight) {
      res = res - blockHeaderHeight;
    }
    if (options?.innerExtraHeight) {
      res = res - options.innerExtraHeight;
    }
    return res;
  }
  return height;
};

//其他非数据区块高度,如iframe、markdown
export const useBlockHeight = () => {
  const fieldSchema = useFieldSchema();
  const pageSchema = useMemo(() => getPageSchema(fieldSchema), []);
  const { disablePageHeader, enablePageTabs, hidePageTitle } = pageSchema?.['x-component-props'] || {};
  const heightProps = { ...fieldSchema?.['x-component-props'], disablePageHeader, enablePageTabs, hidePageTitle };
  const pageFullScreenHeight = useFullScreenHeight(heightProps);
  const { heightMode, height } = heightProps || {};

  if (!heightProps?.heightMode || heightMode === HeightMode.DEFAULT) {
    return;
  }
  if (heightMode === HeightMode.FULL_HEIGHT) {
    return window.innerHeight - pageFullScreenHeight;
  }
  return height;
};
export const useTableSize = () => {
  const [width, setTableWidth] = useState<number>();
  const elementRef = useRef<HTMLDivElement>(null);
  const targetHeight = useTableHeight();
  const calcTableSize = useCallback(
    debounce(() => {
      if (!elementRef.current) return;
      const clientRect = elementRef.current.getBoundingClientRect();
      const tableContentRect = elementRef.current.querySelector('.ant-table')?.getBoundingClientRect();
      if (!tableContentRect) return;
      setTableWidth(clientRect.width);
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

  return { height: targetHeight, width, tableSizeRefCallback };
};

const hasActionContainerInParentChain = (schema) => {
  if (!schema) return null;

  if (schema['x-component'] === 'Action.Container') {
    return schema?.parent['x-component-props']?.['openMode'] !== 'page';
  }
  return hasActionContainerInParentChain(schema.parent);
};
