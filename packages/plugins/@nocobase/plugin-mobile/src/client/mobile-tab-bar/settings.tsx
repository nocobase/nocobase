/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { SchemaSettings, useSchemaSettingsRender } from '@nocobase/client';

export const mobileTabBarSettings = new SchemaSettings({
  name: 'mobile:tab-bar',
  items: [
    {
      name: 'test',
      type: 'item',
      useComponentProps() {
        return {
          title: 'Test',
        };
      },
    },
  ],
});

export const MobileTabBarSettings = () => {
  const { render } = useSchemaSettingsRender(mobileTabBarSettings.name);
  return <div style={{ display: 'inline-block', position: 'absolute', right: 10 }}>{render()}</div>;
};
