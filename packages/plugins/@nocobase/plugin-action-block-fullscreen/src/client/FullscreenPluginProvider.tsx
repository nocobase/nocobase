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
import { FullscreenActionInitializer, FullscreenDesigner } from '.';
import { FullscreenContext } from './context';
import { FullscreenAction } from './FullscreenAction';

export const FullscreenPluginProvider = (props: any) => {
  return (
    <SchemaComponentOptions components={{ FullscreenActionInitializer, FullscreenDesigner, FullscreenAction }}>
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
