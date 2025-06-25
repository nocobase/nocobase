/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useToken } from '@nocobase/client';
import _ from 'lodash';
import React, { FC, useEffect } from 'react';
import classnames from 'classnames';
import { PageBackgroundColor } from '../../../constants';

export const MobilePageContentContainer: FC<{ hideTabBar?: boolean; className?: string }> = ({
  children,
  hideTabBar,
  className,
}) => {
  const [mobileTabBarHeight, setMobileTabBarHeight] = React.useState(0);
  const [mobilePageHeader, setMobilePageHeader] = React.useState(0);
  const { token } = useToken();

  useEffect(() => {
    const navigationBar = _.last(document.querySelectorAll<HTMLDivElement>('.mobile-page-header'));
    setMobilePageHeader(navigationBar?.offsetHeight);

    if (!hideTabBar) {
      const mobileTabBar = document.querySelector<HTMLDivElement>('.mobile-tab-bar');
      setMobileTabBarHeight(mobileTabBar?.offsetHeight);
    }
    // 这里依赖项要不需要填，每次都刷新
  });
  return (
    <>
      {mobilePageHeader ? <div style={{ height: mobilePageHeader }}></div> : null}
      <div
        className={classnames('mobile-page-content', className)}
        data-testid="mobile-page-content"
        style={{
          height: `calc(100% - ${(mobileTabBarHeight || 0) + (mobilePageHeader || 0)}px)`,
          boxSizing: 'border-box',
          maxWidth: '100%',
          overflowX: 'hidden',
          backgroundColor: PageBackgroundColor,
          paddingInline: token.paddingPageHorizontal,
          paddingBlock: token.paddingPageVertical,
        }}
      >
        {children}
      </div>
      {mobileTabBarHeight ? <div style={{ height: mobileTabBarHeight }}></div> : null}
    </>
  );
};
