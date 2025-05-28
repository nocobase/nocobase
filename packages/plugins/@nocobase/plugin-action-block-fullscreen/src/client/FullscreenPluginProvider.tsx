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
import { FullscreenActionInitializer } from './FullscreenActionInitializer';
import { FullscreenAction } from './FullscreenAction';
import { FullscreenContext } from './context';

export const FullscreenPluginProvider = (props: any) => {
  return (
    <SchemaComponentOptions components={{ FullscreenActionInitializer, FullscreenAction }}>
      <FullscreenContext.Provider
        value={
          {
            // Add your context values here
          }
        }
      >
        {props.children}
      </FullscreenContext.Provider>
    </SchemaComponentOptions>
  );
};
