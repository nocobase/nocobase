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
import { useFieldSchema } from '@formily/react';

import { useMobileTitle } from '../mobile-providers';
import { useMobilePage } from '../mobile-page/context';
import { SchemaComponent } from '@nocobase/client';
import { MobileNavigationBarTabs } from './MobileNavigationBarTabs';
import { useStyles } from './styles';

export const MobileNavigationBar: FC = () => {
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
    <div className={styles.mobileNavigationBar} style={{ borderBottom: enableNavigationBarTabs ? 'none' : 'auto' }}>
      <SafeArea position="top" />
      <NavBar
        backArrow={false}
        back={null}
        left={<SchemaComponent name="leftActions" schema={fieldSchema.properties['leftActions']} />}
        right={<SchemaComponent name="rightActions" schema={fieldSchema.properties['rightActions']} />}
      >
        {enableNavigationBarTitle ? title : null}
      </NavBar>
      {enableNavigationBarTabs && <MobileNavigationBarTabs />}
    </div>
  );
};
