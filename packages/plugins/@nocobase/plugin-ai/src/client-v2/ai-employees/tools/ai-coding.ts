/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useApp, type ToolsOptions } from '@nocobase/client-v2';
import type { FlowContext } from '@nocobase/flow-engine';
import { getSnippetBody } from '@nocobase/flow-engine';
import { applyPatch } from 'diff';
import { useChat } from '../chatbox/hooks/useChat';
import { useChatConversationsStore } from '../chatbox/stores/chat-conversations';
import { getChatApplicationKey, useChatMessagesStore } from '../chatbox/stores/chat-messages';
import type { ChatEditorRef } from '../types';

type FlowInfoContext = FlowContext & {
  getApiInfos?: () => Promise<unknown>;
  getEnvInfos?: () => Promise<unknown>;
  getVarInfos?: (options: { path?: unknown; maxDepth?: number }) => Promise<unknown>;
  previewRunJS?: (code: string) => Promise<Record<string, unknown>>;
};

type FlowContextToolState = ToolsOptions & {
  flowContext?: FlowInfoContext;
};

type EditorToolState = ToolsOptions & {
  editorRef?: ChatEditorRef | null;
};

const editorVersions = new Map<string, number>();
const workspaceToolError = 'This conversation is bound to a code workspace. Please use Workspace tools instead.';

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function getCurrentEditorRef(app: { name: string }) {
  const state = useChatMessagesStore.getState();
  const sessionId = useChatConversationsStore.getState().currentConversation;
  const target = state.getSessionState(sessionId).codingTarget;
  const applicationKey = getChatApplicationKey(app);
  if (!target) {
    throw new Error('Current code editor is not available.');
  }
  if (target.applicationKey !== applicationKey) {
    throw new Error('The bound code editor belongs to a different application.');
  }
  if (target.type === 'workspace') {
    throw new Error(workspaceToolError);
  }
  const editorRef = state.editorRef[target.applicationKey]?.[target.editorUid];
  if (!editorRef) {
    throw new Error('Current code editor is not available.');
  }
  return { applicationKey: target.applicationKey, uid: target.editorUid, editorRef };
}

function assertCompatibleLegacyToolTarget(app: { name: string }) {
  const state = useChatMessagesStore.getState();
  const sessionId = useChatConversationsStore.getState().currentConversation;
  const target = state.getSessionState(sessionId).codingTarget;
  if (!target) {
    return;
  }
  if (target.applicationKey !== getChatApplicationKey(app)) {
    throw new Error('The bound code editor belongs to a different application.');
  }
  if (target.type === 'workspace') {
    throw new Error(workspaceToolError);
  }
}

function getEditorState(app: { name: string }) {
  const { applicationKey, uid, editorRef } = getCurrentEditorRef(app);
  const code = editorRef.read();
  return {
    applicationKey,
    uid,
    editorRef,
    code,
    version: editorVersions.get(`${applicationKey}:${uid}`) ?? 0,
  };
}

function bumpEditorVersion(applicationKey: string, uid: string) {
  const key = `${applicationKey}:${uid}`;
  const version = (editorVersions.get(key) ?? 0) + 1;
  editorVersions.set(key, version);
  return version;
}

function isPreviewSuccess(content: unknown) {
  return !!content && typeof content === 'object' && (content as { success?: unknown }).success === true;
}

function splitLinesPreserveNewline(input: string) {
  if (!input) {
    return [];
  }
  return input.match(/[^\n]*\n|[^\n]+/g) ?? [];
}

function formatPatchRange(start: string, count: number) {
  return count === 1 ? start : `${start},${count}`;
}

function normalizeUnifiedDiffHunkHeaders(patch: string) {
  const lines = splitLinesPreserveNewline(patch);
  const result: string[] = [];
  let index = 0;

  while (index < lines.length) {
    const header = lines[index];
    const match = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@(.*)(\n?)$/.exec(header);
    if (!match) {
      result.push(header);
      index++;
      continue;
    }

    const hunkLines: string[] = [];
    index++;
    while (index < lines.length && !lines[index].startsWith('@@ ')) {
      hunkLines.push(lines[index]);
      index++;
    }

    let oldCount = 0;
    let newCount = 0;
    for (const line of hunkLines) {
      if (line.startsWith('\\ No newline at end of file')) {
        continue;
      }
      const marker = line[0];
      if (marker === ' ' || marker === '-') {
        oldCount++;
      }
      if (marker === ' ' || marker === '+') {
        newCount++;
      }
    }

    result.push(
      `@@ -${formatPatchRange(match[1], oldCount)} +${formatPatchRange(match[2], newCount)} @@${match[3]}${
        match[4] || ''
      }`,
    );
    result.push(...hunkLines);
  }

  return result.join('');
}

export function applyUnifiedDiff(source: string, patch: string) {
  const result = applyPatch(source, normalizeUnifiedDiffHunkHeaders(patch), { fuzzFactor: 2 });
  if (result === false) {
    throw new Error('Patch could not be applied to the current editor code.');
  }
  return result;
}

export const listCodeSnippetTool: [string, ToolsOptions] = [
  'listCodeSnippet',
  {
    invoke(this: EditorToolState) {
      return (this.editorRef?.snippetEntries ?? []).map(({ body: _body, ...item }) => item);
    },
    useHooks(this: EditorToolState) {
      const app = useApp();
      const applicationKey = getChatApplicationKey(app);
      const currentConversation = useChatConversationsStore.use.currentConversation();
      const chat = useChat(currentConversation);
      const target = chat.use.codingTarget();
      const editorRefMap = chat.use.editorRef() ?? {};
      this.editorRef =
        target?.type === 'single-file' && target.applicationKey === applicationKey
          ? editorRefMap[target.editorUid] ?? null
          : null;
      return this;
    },
  },
];

export const getCodeSnippetTool: [string, ToolsOptions] = [
  'getCodeSnippet',
  {
    invoke(_app, { ref }: { ref?: string }) {
      return getSnippetBody(ref);
    },
  },
];

export const getContextApisTool: [string, ToolsOptions] = [
  'getContextApis',
  {
    async invoke(this: FlowContextToolState) {
      const result = await this.flowContext?.getApiInfos?.();
      return result ?? {};
    },
    useHooks(this: FlowContextToolState) {
      const app = useApp();
      const applicationKey = getChatApplicationKey(app);
      const currentConversation = useChatConversationsStore.use.currentConversation();
      const chat = useChat(currentConversation);
      const target = chat.use.codingTarget();
      const flowContext = chat.use.flowContext() as FlowInfoContext | undefined;
      this.flowContext = target?.applicationKey === applicationKey ? flowContext : undefined;
      return this;
    },
  },
];

export const getContextEnvsTool: [string, ToolsOptions] = [
  'getContextEnvs',
  {
    async invoke(this: FlowContextToolState) {
      const result = await this.flowContext?.getEnvInfos?.();
      return result ?? {};
    },
    useHooks(this: FlowContextToolState) {
      const app = useApp();
      const applicationKey = getChatApplicationKey(app);
      const currentConversation = useChatConversationsStore.use.currentConversation();
      const chat = useChat(currentConversation);
      const target = chat.use.codingTarget();
      const flowContext = chat.use.flowContext() as FlowInfoContext | undefined;
      this.flowContext = target?.applicationKey === applicationKey ? flowContext : undefined;
      return this;
    },
  },
];

export const getContextVarsTool: [string, ToolsOptions] = [
  'getContextVars',
  {
    async invoke(this: FlowContextToolState, _app, args: { path?: unknown; depth?: number }) {
      const result = await this.flowContext?.getVarInfos?.({
        path: args?.path,
        maxDepth: args?.depth ?? 3,
      });
      return result ?? {};
    },
    useHooks(this: FlowContextToolState) {
      const app = useApp();
      const applicationKey = getChatApplicationKey(app);
      const currentConversation = useChatConversationsStore.use.currentConversation();
      const chat = useChat(currentConversation);
      const target = chat.use.codingTarget();
      const flowContext = chat.use.flowContext() as FlowInfoContext | undefined;
      this.flowContext = target?.applicationKey === applicationKey ? flowContext : undefined;
      return this;
    },
  },
];

export const writeJSCodeTool: [string, ToolsOptions] = [
  'writeJSCode',
  {
    async invoke(app, args: { code?: unknown }) {
      try {
        assertCompatibleLegacyToolTarget(app);
      } catch (error) {
        return {
          status: 'error',
          content: {
            success: false,
            message: `Write code failed: ${getErrorMessage(error)}`,
          },
        };
      }
      if (typeof args?.code !== 'string') {
        return {
          status: 'error',
          content: {
            success: false,
            message: 'Write code failed: `code` must be a string.',
          },
        };
      }
      let current;
      try {
        current = getCurrentEditorRef(app);
      } catch (error) {
        return {
          status: 'error',
          content: {
            success: false,
            message: `Write code failed: ${getErrorMessage(error)}`,
          },
        };
      }
      const { code } = args;
      current.editorRef.write(code);
      const version = bumpEditorVersion(current.applicationKey, current.uid);
      return {
        status: 'success',
        content: {
          success: true,
          version,
          lineCount: code ? code.split('\n').length : 0,
          message: 'Code written to the current editor.',
        },
      };
    },
  },
];

export const readJSCodeTool: [string, ToolsOptions] = [
  'readJSCode',
  {
    async invoke(app) {
      try {
        const current = getEditorState(app);
        return {
          status: 'success',
          content: {
            success: true,
            version: current.version,
            lineCount: current.code ? current.code.split('\n').length : 0,
            code: current.code,
            message: 'Current editor code read successfully.',
          },
        };
      } catch (error) {
        return {
          status: 'error',
          content: {
            success: false,
            message: `Read code failed: ${getErrorMessage(error)}`,
          },
        };
      }
    },
  },
];

export const patchJSCodeTool: [string, ToolsOptions] = [
  'patchJSCode',
  {
    async invoke(app, args: { patch?: unknown }) {
      try {
        assertCompatibleLegacyToolTarget(app);
      } catch (error) {
        return {
          status: 'error',
          content: {
            success: false,
            message: `Patch failed: ${getErrorMessage(error)}`,
          },
        };
      }
      if (typeof args?.patch !== 'string' || args.patch.length === 0) {
        return {
          status: 'error',
          content: {
            success: false,
            message: 'Patch failed: `patch` must be a non-empty string.',
          },
        };
      }
      let current;
      try {
        current = getEditorState(app);
      } catch (error) {
        return {
          status: 'error',
          content: {
            success: false,
            message: `Patch failed: ${getErrorMessage(error)}`,
          },
        };
      }
      try {
        const nextCode = applyUnifiedDiff(current.code, args.patch);
        current.editorRef.write(nextCode);
        const version = bumpEditorVersion(current.applicationKey, current.uid);
        return {
          status: 'success',
          content: {
            success: true,
            version,
            lineCount: nextCode ? nextCode.split('\n').length : 0,
            message: 'Patch applied to the current editor.',
          },
        };
      } catch (error) {
        return {
          status: 'error',
          content: {
            success: false,
            message: `Patch failed: ${getErrorMessage(
              error,
            )}. Call readJSCode before retrying so the next patch is based on the current editor code.`,
          },
        };
      }
    },
  },
];

export const lintAndTestJSTool: [string, ToolsOptions] = [
  'lintAndTestJS',
  {
    async invoke(this: FlowContextToolState, app, args: { code?: unknown }) {
      let editorState: ReturnType<typeof getEditorState> | undefined;
      try {
        if (typeof args?.code === 'string') {
          assertCompatibleLegacyToolTarget(app);
        } else {
          editorState = getEditorState(app);
        }
      } catch (error) {
        return {
          status: 'error',
          content: {
            success: false,
            message: `Preview execution error: ${getErrorMessage(error)}`,
          },
        };
      }
      let ctx = this.flowContext;
      if (!ctx) {
        ctx = app.flowEngine?.context as FlowInfoContext | undefined;
      }
      if (!ctx?.previewRunJS) {
        return {
          status: 'error',
          content: {
            success: false,
            message: 'Preview context not available. Cannot run code validation.',
          },
        };
      }
      try {
        const code = typeof args?.code === 'string' ? args.code : editorState?.code;
        if (typeof code !== 'string') {
          throw new Error('Current code editor is not available.');
        }
        const content = await ctx.previewRunJS(code);
        let ranCurrentEditor = false;
        if (editorState && isPreviewSuccess(content) && typeof editorState.editorRef.run === 'function') {
          await editorState.editorRef.run();
          ranCurrentEditor = true;
        }
        return {
          status: 'success',
          content: {
            ...content,
            version: editorState?.version,
            userReminder: ranCurrentEditor
              ? 'The current editor code has been validated and run, but it has not been saved permanently. Remind the user to click the save button manually.'
              : undefined,
          },
        };
      } catch (error) {
        return {
          status: 'error',
          content: {
            success: false,
            message: `Preview execution error: ${getErrorMessage(error)}`,
          },
        };
      }
    },
    useHooks(this: FlowContextToolState) {
      const app = useApp();
      const applicationKey = getChatApplicationKey(app);
      const currentConversation = useChatConversationsStore.use.currentConversation();
      const chat = useChat(currentConversation);
      const target = chat.use.codingTarget();
      const flowContext = chat.use.flowContext() as FlowInfoContext | undefined;
      this.flowContext = target?.applicationKey === applicationKey ? flowContext : undefined;
      return this;
    },
  },
];
