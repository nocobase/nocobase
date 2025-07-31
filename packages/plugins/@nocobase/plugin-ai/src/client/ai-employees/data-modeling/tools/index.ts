/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { tval } from '@nocobase/utils/client';
import { DataModelingCard } from '../ui/DataModelingCard';
import { DataModelingModal } from '../ui/DataModelingModal';
import { useChatBoxStore } from '../../chatbox/stores/chat-box';
import { useChatConversationsStore } from '../../chatbox/stores/chat-conversations';
import { useChatToolsStore } from '../../chatbox/stores/chat-tools';
import { ToolOptions } from '../../../manager/ai-manager';
import { useChatMessageActions } from '../../chatbox/hooks/useChatMessageActions';
import { useAISelectionContext } from '../../1.x/selector/AISelectorProvider';
import { useDataSource } from '@nocobase/client';

export const defineCollectionsTool: [string, string, ToolOptions] = [
  'dataModeling',
  'defineCollections',
  {
    ui: {
      card: DataModelingCard,
      modal: {
        title: tval('Data modeling', { ns: 'ai' }),
        okText: tval('Finish review and apply', { ns: 'ai' }),
        useOnOk: () => {
          const ds = useDataSource();
          const { ctx } = useAISelectionContext();
          const refresh = ctx['collections:list']?.service?.refresh;

          const currentEmployee = useChatBoxStore.use.currentEmployee();

          const currentConversation = useChatConversationsStore.use.currentConversation();

          const activeMessageId = useChatToolsStore.use.activeMessageId();
          const adjustArgs = useChatToolsStore.use.adjustArgs();

          const { callTool } = useChatMessageActions();

          return {
            onOk: async () => {
              await callTool({
                sessionId: currentConversation,
                aiEmployee: currentEmployee,
                messageId: activeMessageId,
                args: adjustArgs,
              });
              await ds?.reload();
              await refresh?.();
            },
          };
        },
        Component: DataModelingModal,
      },
    },
  },
];
