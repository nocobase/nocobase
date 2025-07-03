/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { theme, Skeleton } from 'antd';
import React, { useEffect, useState } from 'react';
import ResizeObserver from 'resize-observer-polyfill';

/**
 * HOC that injects calculated scroll.y into antd Table based on refs
 */
export function withAutoScrollY(WrappedTable) {
  return function AutoScrollTable(props) {
    const { autoScrollRefs, scroll = {}, ...restProps } = props;
    const { token } = theme.useToken();

    const {
      tableContainerRef,
      theadRef,
      headerButtonRef,
      height,
      padding = 2 * token.paddingLG,
    } = autoScrollRefs || {};

    const [scrollY, setScrollY] = useState(600);
    useEffect(() => {
      if (!height) {
        setScrollY(600);
        return;
      }
      const update = () => {
        requestAnimationFrame(() => {
          const headerButtonHeight = headerButtonRef?.current?.offsetHeight || 0;
          const theadHeight = theadRef?.current?.offsetHeight || 0;
          const paginationNode = tableContainerRef.current.querySelector('.ant-pagination');
          const paginationHeight = paginationNode?.getBoundingClientRect()?.height + token.padding || 0;
          const y = height - headerButtonHeight - theadHeight - paginationHeight - token.marginLG - padding;
          setScrollY(Math.max(y, 0));
        });
      };
      update();

      const ro = new ResizeObserver(update);
      if (headerButtonRef?.current) ro.observe(headerButtonRef.current);
      if (theadRef?.current) ro.observe(theadRef.current);
      if (tableContainerRef?.current) ro.observe(tableContainerRef.current);

      return () => ro.disconnect();
    }, [tableContainerRef, theadRef, headerButtonRef, height, padding]);
    if (scrollY === null && height) return <Skeleton />; //避免闪动
    return (
      <WrappedTable
        {...restProps}
        scroll={{ ...scroll, y: scrollY }}
        components={{
          ...(props.components || {}),
          header: {
            ...(props.components?.header || {}),
            wrapper: (wrapperProps) => <thead ref={theadRef} {...wrapperProps} />,
          },
        }}
      />
    );
  };
}
