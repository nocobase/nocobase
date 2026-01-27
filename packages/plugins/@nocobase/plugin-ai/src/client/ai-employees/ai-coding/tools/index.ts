/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { getSnippetBody } from '@nocobase/flow-engine';
import { ToolOptions } from '../../../manager/ai-manager';
import { useChatMessagesStore } from '../../chatbox/stores/chat-messages';

export const listCodeSnippetTool: [string, string, ToolOptions] = [
  'codeEditor',
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
      const editorRefMap = useChatMessagesStore.use.editorRef() ?? {};
      const currentEditorRefUid = useChatMessagesStore.use.currentEditorRefUid();
      this.editorRef = editorRefMap[currentEditorRefUid];
      return this;
    },
  },
];

export const getCodeSnippetTool: [string, string, ToolOptions] = [
  'codeEditor',
  'getCodeSnippet',
  {
    invoke(_app, { ref }) {
      return getSnippetBody(ref);
    },
  },
];
