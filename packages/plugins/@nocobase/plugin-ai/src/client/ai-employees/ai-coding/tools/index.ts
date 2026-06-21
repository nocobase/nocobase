/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { getSnippetBody } from '@nocobase/flow-engine';
import { useChat } from '../../chatbox/hooks/useChat';
import { useChatConversationsStore } from '../../chatbox/stores/chat-conversations';
import { ToolsOptions } from '@nocobase/client';

export const listCodeSnippetTool: [string, ToolsOptions] = [
  'listCodeSnippet',
  {
    invoke(_app, _args) {
      const result = this.editorRef?.snippetEntries ?? [];
      for (const item of result) {
        delete item.body;
      }
      return result;
    },
    useHooks() {
      const currentConversation = useChatConversationsStore.use.currentConversation();
      const chat = useChat(currentConversation);
      const editorRefMap = chat.use.editorRef() ?? {};
      const currentEditorRefUid = chat.use.currentEditorRefUid();
      this.editorRef = editorRefMap[currentEditorRefUid];
      return this;
    },
  },
];

export const getCodeSnippetTool: [string, ToolsOptions] = [
  'getCodeSnippet',
  {
    invoke(_app, { ref }) {
      return getSnippetBody(ref);
    },
  },
];
