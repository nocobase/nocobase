/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useContext } from 'react';
import { AISelectionProvider } from './1.x/selector/AISelectorProvider';
import { AISettingsProvider } from './AISettingsProvider';
import { ChatBoxLayout } from './chatbox/ChatBoxLayout';
import { AISelection } from './AISelection';
import { ContextAwareTooltip } from './ContextAwareTooltip';
import { AISelectionControl } from './AISelectionControl';
import { CurrentUserContext } from '@nocobase/client';

export const AIEmployeesProvider: React.FC<{
  children: React.ReactNode;
}> = (props) => {
  const currentUserCtx = useContext(CurrentUserContext);

  if (!currentUserCtx?.data?.data) {
    return <>{props.children}</>;
  }

  return (
    <AISelectionProvider>
      <AISettingsProvider>
        <ChatBoxLayout>{props.children}</ChatBoxLayout>
        {/* <ContextAwareTooltip /> */}
        <AISelection />
        <AISelectionControl />
      </AISettingsProvider>
    </AISelectionProvider>
  );
};
