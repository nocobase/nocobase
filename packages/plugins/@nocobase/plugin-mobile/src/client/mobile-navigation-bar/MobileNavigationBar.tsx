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

export interface MobileNavigationBarProps {
  /**
   * @default true
   */
  enableTitle?: boolean;
  /**
   * @default false
   */
  enableTabs?: boolean;
}

export const MobileNavigationBar: FC<MobileNavigationBarProps> = ({ enableTitle = true, enableTabs }) => {
  const { title } = useMobileTitle();

  return (
    <Affix offsetTop={0}>
      <NavBar backArrow={false}>{enableTitle ? title : null}</NavBar>
    </Affix>
  );
};
