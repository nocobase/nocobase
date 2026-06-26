/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import {
  ProfileCard as AIEmployeeProfileCard,
  avatars,
  useAIConfigRepository,
  useChatBoxActions,
  useChatBoxStore,
  useChatMessagesStore,
} from '@nocobase/plugin-ai/client';
import type { FlowSettingsContext } from '@nocobase/flow-engine';

import { DaraButton, type DaraButtonRuntime } from '../../client-v2/flow/components/DaraButton';
import { registerChartSettingsExtension } from '../../client-v2/flow/models/chart-settings-extensions';

const DaraChartSettingsButton: React.FC<{ ctx: FlowSettingsContext<any> }> = ({ ctx }) => {
  const aiConfigRepository = useAIConfigRepository();
  const setEditorRef = useChatMessagesStore.use.setEditorRef();
  const setCurrentEditorRefUid = useChatMessagesStore.use.setCurrentEditorRefUid();
  const addContextItems = useChatMessagesStore.use.addContextItems();
  const open = useChatBoxStore.use.open();
  const currentEmployee = useChatBoxStore.use.currentEmployee();
  const { triggerTask } = useChatBoxActions();

  const loadAIEmployees = React.useCallback(() => aiConfigRepository.getAIEmployees(), [aiConfigRepository]);

  const runtime = React.useMemo<DaraButtonRuntime>(
    () => ({
      aiEmployees: aiConfigRepository.aiEmployees,
      loadAIEmployees,
      setEditorRef,
      setCurrentEditorRefUid,
      addContextItems,
      open,
      currentEmployee,
      triggerTask,
      ProfileCard: AIEmployeeProfileCard,
      avatars,
    }),
    [
      addContextItems,
      aiConfigRepository.aiEmployees,
      currentEmployee,
      loadAIEmployees,
      open,
      setCurrentEditorRefUid,
      setEditorRef,
      triggerTask,
    ],
  );

  return <DaraButton ctx={ctx} runtime={runtime} />;
};

const closeAssociatedAIChatBox = (uid: string) => {
  const state = useChatBoxStore.getState();
  const associatedUid = useChatMessagesStore.getState().currentEditorRefUid;
  if (state.open && associatedUid === uid) {
    state.setOpen(false);
  }
};

export const registerDaraChartSettingsExtension = () => {
  registerChartSettingsExtension({
    key: 'dara',
    renderHeaderExtra: (ctx) => <DaraChartSettingsButton ctx={ctx} />,
    onClose: (ctx) => {
      closeAssociatedAIChatBox(ctx.model.uid);
    },
  });
};
