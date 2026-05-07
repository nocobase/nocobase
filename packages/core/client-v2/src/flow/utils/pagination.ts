/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css, cx } from '@emotion/css';
import type { PaginationProps } from 'antd';
import React from 'react';

/**
 * 计算未知总数场景下的 Pagination total：
 * - 本页不足 pageSize 或 hasNext=false，说明到末页
 * - 否则用 +1 触发“还有下一页”
 */
export const getUnknownCountPaginationTotal = (options: {
  dataLength?: number;
  pageSize?: number;
  current?: number;
  hasNext?: boolean;
}) => {
  const dataLength = options.dataLength || 0;
  const pageSize = options.pageSize || 10;
  const current = options.current || 1;
  if (dataLength < pageSize || !options.hasNext) {
    return pageSize * current;
  }
  return pageSize * current + 1;
};

export const getSimpleModePaginationClassName = (withLineHeight = false) => {
  return css`
    .ant-pagination-simple-pager {
      display: none !important;
    }
    ${withLineHeight
      ? `
      li {
        line-height: 32px !important;
      }
    `
      : ''}
  `;
};

const mobileCompactPaginationClassName = css`
  justify-content: flex-end !important;
  .ant-pagination-total-text,
  .ant-pagination-options,
  .ant-pagination-jump-prev,
  .ant-pagination-jump-next {
    display: none !important;
  }
`;

export const getMobileCompactPaginationClassName = () => mobileCompactPaginationClassName;

export const mergePaginationClassName = (...classNames: Array<string | undefined | false>) => {
  return cx(...classNames.filter(Boolean));
};

export const createCompactSimpleItemRender = (options: {
  current?: number;
  controlHeight?: number;
  currentTextMarginLeft?: number;
}): PaginationProps['itemRender'] => {
  const current = options.current || 1;
  const controlHeight = options.controlHeight || 32;
  const currentTextStyle = options.currentTextMarginLeft
    ? { marginLeft: `${options.currentTextMarginLeft}px` }
    : undefined;

  return (_, type, originalElement) => {
    if (type === 'prev') {
      return React.createElement(
        'div',
        {
          style: { display: 'flex' },
          className: css`
            .ant-pagination-item-link {
              min-width: ${controlHeight}px;
            }
          `,
        },
        originalElement,
        React.createElement('div', { style: currentTextStyle }, current),
      );
    }
    return originalElement;
  };
};

export const applyMobilePaginationProps = <T extends PaginationProps>(
  pagination: T,
  isMobileLayout: boolean,
): PaginationProps => {
  if (!isMobileLayout) {
    return pagination;
  }
  return {
    ...pagination,
    showTotal: false,
    showSizeChanger: false,
    showLessItems: true,
    className: mergePaginationClassName(pagination.className, getMobileCompactPaginationClassName()),
  };
};
