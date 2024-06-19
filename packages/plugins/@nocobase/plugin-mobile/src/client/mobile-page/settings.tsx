/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaSettings, useSchemaSettingsRender } from '@nocobase/client';
import React from 'react';

export const mobilePageSettings = new SchemaSettings({
  name: 'mobile:page',
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

export const MobilePageSettings = () => {
  const { render } = useSchemaSettingsRender(mobilePageSettings.name);
  return <div style={{ display: 'inline-block', position: 'absolute', right: 0 }}>{render()}</div>;
};
