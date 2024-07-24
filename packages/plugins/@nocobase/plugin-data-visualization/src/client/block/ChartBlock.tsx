/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaComponentOptions, SchemaInitializerContext, useSchemaInitializer } from '@nocobase/client';
import React, { useState } from 'react';
import { ChartConfigProvider } from '../configure';
import { ChartDataProvider } from './ChartDataProvider';
import { ChartRenderer, ChartRendererProvider } from '../renderer';
import { ChartFilterBlockProvider, ChartFilterBlockDesigner } from '../filter';
import { ChartFilterProvider } from '../filter/FilterProvider';
import { css } from '@emotion/css';

export const ChartV2Block: React.FC = (props) => {
  const [initialVisible, setInitialVisible] = useState(false);
  const schemaInitializerContextData = useSchemaInitializer();
  return (
    <SchemaInitializerContext.Provider
      value={{ ...schemaInitializerContextData, visible: initialVisible, setVisible: setInitialVisible }}
    >
      <SchemaComponentOptions
        components={{ ChartRenderer, ChartRendererProvider, ChartFilterBlockProvider, ChartFilterBlockDesigner }}
      >
        <div
          className={css`
            .ant-nb-card-item {
              margin-bottom: 0;
              .ant-card {
                box-shadow: none;
                margin-bottom: 0 !important;
              }
            }
            .nb-grid-warp > button:last-child {
              margin-top: 20px;
              margin-bottom: 0 !important;
            }
          `}
        >
          <ChartDataProvider>
            <ChartFilterProvider>
              <ChartConfigProvider>{props.children}</ChartConfigProvider>
            </ChartFilterProvider>
          </ChartDataProvider>
        </div>
      </SchemaComponentOptions>
    </SchemaInitializerContext.Provider>
  );
};
