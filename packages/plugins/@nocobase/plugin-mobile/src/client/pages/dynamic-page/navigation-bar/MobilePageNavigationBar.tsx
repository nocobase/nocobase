/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { FC, useMemo } from 'react';
import { NavBar, SafeArea } from 'antd-mobile';
import { useFieldSchema } from '@formily/react';
import { SchemaComponent } from '@nocobase/client';

import { useStyles } from './styles';
import { useMobilePage } from '../context';
import { getActionBarSchemaByPosition } from './schema';
import { useMobileTitle } from '../../../mobile-providers';
import { MobilePageNavigationBarTabs } from './MobilePageNavigationBarTabs';

export const MobilePageNavigationBar: FC = () => {
  const { title } = useMobileTitle();
  const {
    enableNavigationBar = true,
    enableNavigationBarTabs = false,
    enableNavigationBarTitle = true,
  } = useMobilePage();
  const fieldSchema = useFieldSchema();
  const { styles } = useStyles();

  const leftSchema = useMemo(() => getActionBarSchemaByPosition(fieldSchema, 'left', { marginLeft: 8 }), [fieldSchema]);
  const rightSchema = useMemo(
    () => getActionBarSchemaByPosition(fieldSchema, 'right', { marginLeft: 8 }),
    [fieldSchema],
  );
  const bottomSchema = useMemo(() => getActionBarSchemaByPosition(fieldSchema, 'bottom', {}, false), [fieldSchema]);

  if (!enableNavigationBar) return null;
  return (
    <div className={styles.mobileNavigationBar}>
      <SafeArea position="top" />

      <NavBar
        backArrow={false}
        back={null}
        left={<SchemaComponent schema={leftSchema} />}
        right={<SchemaComponent schema={rightSchema} />}
      >
        {enableNavigationBarTitle ? title : null}
      </NavBar>

      <SchemaComponent schema={bottomSchema} />

      {enableNavigationBarTabs && <MobilePageNavigationBarTabs />}
    </div>
  );
};
