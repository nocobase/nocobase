/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { BlockRefreshButton } from '../initializers/BlockRefreshAction';
import { SchemaComponentOptions, useCurrentPopupContext, useLocalVariables } from '@nocobase/client';
import { GlobalAutoRefreshProvider } from './GlobalAutoRefreshProvider';
import _ from 'lodash';

export const ChartBlockProvider: React.FC = (props) => {
  const currentPopupContext = useCurrentPopupContext();
  const localVariables = useLocalVariables();
  const popupRecordVariable = localVariables?.find((variable) => variable.name === '$nPopupRecord');
  const popupCtxReady = _.isEmpty(currentPopupContext) || popupRecordVariable?.ctx;

  return (
    <SchemaComponentOptions
      components={{
        BlockRefreshButton,
      }}
    >
      <GlobalAutoRefreshProvider key={popupCtxReady ? 'ready' : 'not-ready'}>
        {props.children}
      </GlobalAutoRefreshProvider>
    </SchemaComponentOptions>
  );
};
