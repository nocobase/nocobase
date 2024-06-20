/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { FC } from 'react';
import { NavBar } from 'antd-mobile';
import { Affix } from 'antd';
import { useMobileTitle } from '../mobile-providers';
import { useMobilePage } from '../mobile-page/context';

export const MobileNavigationBar: FC = () => {
  const { title } = useMobileTitle();
  const {
    enableNavigationBar = true,
    enableNavigationBarTabs = false,
    enableNavigationBarTitle = true,
  } = useMobilePage();

  if (!enableNavigationBar) return null;

  return (
    <Affix offsetTop={0} style={{ borderBottom: '1px solid var(--adm-color-border)' }}>
      <NavBar backArrow={false}>{enableNavigationBarTitle ? title : null}</NavBar>
    </Affix>
  );
};
