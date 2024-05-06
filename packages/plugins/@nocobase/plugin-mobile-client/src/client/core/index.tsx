/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaComponentOptions } from '@nocobase/client';
import React from 'react';
import {
  MMenuBlockInitializer,
  MMenu,
  MContainer,
  MTabBar,
  MPage,
  MHeader,
  MSettingsBlockInitializer,
  MSettings,
  useGridCardBlockItemProps,
  useGridCardBlockProps,
} from './schema';
import './bridge';

export const MobileCore: React.FC = (props) => {
  return (
    <SchemaComponentOptions
      components={{
        MMenuBlockInitializer,
        MSettingsBlockInitializer,
        MContainer,
        MMenu,
        MTabBar,
        MPage,
        MHeader,
        MSettings,
      }}
      scope={{
        useGridCardBlockItemProps,
        useGridCardBlockProps,
      }}
    >
      {props.children}
    </SchemaComponentOptions>
  );
};
