/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { RemoteSchemaComponent } from '@nocobase/client';
import { useMobileRoutes } from '../../../mobile-providers';
import { useStyles } from './styles';

export const MobilePageContent = () => {
  const { tabSchemaUid } = useParams();
  const { styles } = useStyles();
  const { activeTabBarItem } = useMobileRoutes();
  const [mobileTabBarHeight, setMobileTabBarHeight] = React.useState(0);
  const [mobilePageHeader, setMobilePageHeader] = React.useState(0);
  useEffect(() => {
    const mobileTabBar = document.querySelector<HTMLDivElement>('.mobile-tab-bar');
    const navigationBar = document.querySelector<HTMLDivElement>('.mobile-page-header');
    setMobileTabBarHeight(mobileTabBar?.offsetHeight);
    setMobilePageHeader(navigationBar?.offsetHeight);
    // 这里依赖项要不需要填，每次都刷新
  });

  // 如果 URL 中有 tabSchemaUid，则使用 tabSchemaUid，否则使用第一个 tab 的 pageSchemaUid
  return (
    <div
      className={styles.mobilePageContent}
      data-testid="mobile-page-content"
      style={{
        height: '100%',
        paddingBottom: mobileTabBarHeight,
        paddingTop: mobilePageHeader,
        boxSizing: 'border-box',
      }}
    >
      <RemoteSchemaComponent
        uid={tabSchemaUid || activeTabBarItem?.children?.[0]?.schemaUid}
        NotFoundPage={'MobileNotFoundPage'}
        memoized={false}
      />
    </div>
  );
};
