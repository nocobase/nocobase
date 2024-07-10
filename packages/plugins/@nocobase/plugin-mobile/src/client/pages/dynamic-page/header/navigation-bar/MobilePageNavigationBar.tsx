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
import { RecursionField, useFieldSchema } from '@formily/react';

import { useMobilePage } from '../../context';
import { useMobileTitle } from '../../../../mobile-providers';
import { SchemaToolbarProvider } from '@nocobase/client';

export const MobilePageNavigationBar: FC = () => {
  const { title } = useMobileTitle();
  const { displayNavigationBar = true, displayPageTitle = true } = useMobilePage();
  const fieldSchema = useFieldSchema();
  if (!displayNavigationBar) return null;

  return (
    <div className={'mobile-page-navigation-bar'} data-testid="mobile-page-navigation-bar">
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
        {displayPageTitle ? title : null}
      </NavBar>

      <SchemaToolbarProvider position="bottom">
        <RecursionField name="actionBarBottom" schema={fieldSchema} onlyRenderProperties />
      </SchemaToolbarProvider>
    </div>
  );
};
