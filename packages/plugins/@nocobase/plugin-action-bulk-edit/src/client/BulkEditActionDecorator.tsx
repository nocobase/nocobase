/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ACLActionProvider, PopupSettingsProvider } from '@nocobase/client';
import React, { FC } from 'react';

export const BulkEditActionDecorator: FC = (props) => {
  return (
    <PopupSettingsProvider enableURL={false}>
      <ACLActionProvider>{props.children}</ACLActionProvider>
    </PopupSettingsProvider>
  );
};
