/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { FC } from 'react';
import { NavBar, SafeArea } from 'antd-mobile';
import { RecursionField, useFieldSchema } from '@formily/react';

import { useStyles } from './styles';
import { useMobilePage } from '../context';
import { useMobileTitle } from '../../../mobile-providers';
import { MobilePageNavigationBarTabs } from './MobilePageNavigationBarTabs';
import { cx, SchemaToolbarProvider } from '@nocobase/client';

export const MobilePageNavigationBar: FC = ({ children }) => {
  const { title } = useMobileTitle();
  const {
    enableNavigationBar = true,
    enableNavigationBarTabs = false,
    enableNavigationBarTitle = true,
  } = useMobilePage();
  const fieldSchema = useFieldSchema();
  const { styles } = useStyles();
  if (!enableNavigationBar) return null;

  return (
    <div
      className={cx(styles.mobileNavigationBar, 'mobile-page-navigation-bar')}
      data-testid="mobile-page-navigation-bar"
    >
      <SafeArea position="top" />
      <NavBar
        backArrow={false}
        back={null}
        left={
          <SchemaToolbarProvider position="left">
            <RecursionField name="actionBarLeft" schema={fieldSchema} onlyRenderProperties />
          </SchemaToolbarProvider>
        }
        right={
          <SchemaToolbarProvider position="right">
            <RecursionField name="actionBarRight" schema={fieldSchema} onlyRenderProperties />
          </SchemaToolbarProvider>
        }
      >
        {enableNavigationBarTitle ? title : null}
      </NavBar>

      <SchemaToolbarProvider position="bottom">
        <RecursionField name="actionBarBottom" schema={fieldSchema} onlyRenderProperties />
      </SchemaToolbarProvider>

      {enableNavigationBarTabs && <MobilePageNavigationBarTabs />}
    </div>
  );
};
