/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import {
  applyUnifiedDiff,
  lintAndTestJSTool,
  patchJSCodeTool,
  readJSCodeTool,
  writeJSCodeTool,
} from '../../../client-v2/ai-employees/tools/ai-coding';
import {
  buildToolCodeBlock,
  compactPatchForDisplay,
  shouldSkipCodeToolCardRender,
} from '../../../client-v2/ai-employees/tools/CodeToolCard';
import { createChatBoxRuntime } from '../../../client-v2/ai-employees/chatbox/stores/runtime';
import type { ChatEditorRef } from '../../../client-v2/ai-employees/types';

const createEditorToolState = (uid: string, editorRef: ChatEditorRef) => {
  const chatBoxRuntime = createChatBoxRuntime({ mode: 'global' });
  chatBoxRuntime.chatMessageModel.setEditorRef(uid, editorRef);
  chatBoxRuntime.chatMessageModel.setCurrentEditorRefUid(uid);
  return { chatBoxRuntime };
};

describe('ai coding context tools', () => {
  it('applies a model-generated hunk by searching old lines instead of trusting the hunk line number', () => {
    const source = `// ============================================
// 导入外部模块示例
// ============================================

// 方式一：ctx.importAsync — 动态导入 ESM 模块
// 适用场景：模块以 ES Module 方式发布（如 dayjs、he、lodash-es 等）
// 注意：如果模块只有 default export，ctx.importAsync 会直接返回该默认值

const { default: dayjs } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/dayjs/+esm');
const { default: he } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/he/+esm');

// 方式二：ctx.requireAsync — 加载 AMD/UMD 模块
// 适用场景：模块以 UMD/AMD 方式发布（如 ECharts、lodash 等）

const echarts = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js');
`;
    const patch = `@@ -1,13 +1,13 @@
 // ============================================
 // 导入外部模块示例
 // ============================================
 
 // 方式一：ctx.importAsync — 动态导入 ESM 模块
-// 适用场景：模块以 ES Module 方式发布（如 dayjs、he、lodash-es 等）
+// 适用场景：模块以 ES Module 方式发布（如 he、lodash-es 等）
 // 注意：如果模块只有 default export，ctx.importAsync 会直接返回该默认值
 
-const { default: dayjs } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/dayjs/+esm');
 const { default: he } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/he/+esm');
 
 // 方式二：ctx.requireAsync — 加载 AMD/UMD 模块
-// 适用场景：模块以 UMD/AMD 方式发布（如 ECharts、lodash 等）
+// 适用场景：模块以 UMD/AMD 方式发布（如 ECharts、lodash、dayjs 等）
 
+const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
 const echarts = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js');`;

    const result = applyUnifiedDiff(source, patch);

    expect(result).toContain(
      "const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');",
    );
    expect(result).not.toContain('const { default: dayjs } = await ctx.importAsync');
  });

  it('runs the current editor after lint succeeds', async () => {
    const runCalls: string[] = [];
    const editorState = createEditorToolState('editor-1', {
      read: () => 'ctx.render("ok");',
      write: () => undefined,
      run: async () => {
        runCalls.push('run');
      },
      snippetEntries: [],
      logs: [],
    } as ChatEditorRef);

    const result = await lintAndTestJSTool[1].invoke.call(
      {
        ...editorState,
        flowContext: {
          previewRunJS: async () => ({
            success: true,
            message: 'RunJS preview succeeded: no issues found. Logs: 0.',
          }),
        },
      },
      {} as any,
      {},
    );

    expect(result.status).toBe('success');
    expect(runCalls).toEqual(['run']);
    expect(result.content.userReminder).toContain('click the save button manually');
  });

  it('validates explicitly provided empty code instead of falling back to the editor', async () => {
    const previewedCode: string[] = [];
    const editorState = createEditorToolState('editor-empty-lint', {
      read: () => 'ctx.render("editor");',
      write: () => undefined,
      run: async () => undefined,
      snippetEntries: [],
      logs: [],
    } as ChatEditorRef);

    const result = await lintAndTestJSTool[1].invoke.call(
      {
        ...editorState,
        flowContext: {
          previewRunJS: async (code: string) => {
            previewedCode.push(code);
            return {
              success: true,
              message: 'RunJS preview succeeded: no issues found. Logs: 0.',
            };
          },
        },
      },
      {} as any,
      { code: '' },
    );

    expect(result.status).toBe('success');
    expect(previewedCode).toEqual(['']);
    expect(result.content.userReminder).toBeUndefined();
  });

  it('patches the current editor code without requiring model-managed hashes', async () => {
    let code = 'const label = "old";\nctx.render(label);\n';
    const editorState = createEditorToolState('editor-patch', {
      read: () => code,
      write: (nextCode: string) => {
        code = nextCode;
      },
      snippetEntries: [],
      logs: [],
    } as ChatEditorRef);
    const result = await patchJSCodeTool[1].invoke.call(editorState, {} as any, {
      patch: `@@ -1,2 +1,2 @@
-const label = "old";
+const label = "new";
 ctx.render(label);
`,
      baseHash: 'stale-hash-from-an-older-tool-contract',
    });

    expect(result.status).toBe('success');
    expect(code).toBe('const label = "new";\nctx.render(label);\n');
  });

  it('resolves the latest editor when invoking a patch after the editor reopens', async () => {
    let oldCode = 'const label = "old editor";\nctx.render(label);\n';
    let newCode = 'const label = "new editor";\nctx.render(label);\n';
    const oldEditorRef = {
      read: () => oldCode,
      write: (nextCode: string) => {
        oldCode = nextCode;
      },
      snippetEntries: [],
      logs: [],
    } as ChatEditorRef;
    const newEditorRef = {
      read: () => newCode,
      write: (nextCode: string) => {
        newCode = nextCode;
      },
      snippetEntries: [],
      logs: [],
    } as ChatEditorRef;
    const editorState = createEditorToolState('editor-reopen', oldEditorRef);
    editorState.chatBoxRuntime.chatMessageModel.setEditorRef('editor-reopen', newEditorRef);
    const app = {} as Parameters<NonNullable<(typeof patchJSCodeTool)[1]['invoke']>>[0];

    const result = await patchJSCodeTool[1].invoke.call(editorState, app, {
      patch: `@@ -1,2 +1,2 @@
-const label = "new editor";
+const label = "patched editor";
 ctx.render(label);
`,
    });

    expect(result.status).toBe('success');
    expect(oldCode).toBe('const label = "old editor";\nctx.render(label);\n');
    expect(newCode).toBe('const label = "patched editor";\nctx.render(label);\n');
  });

  it('does not let an old editor cleanup unregister its replacement', () => {
    const oldEditorRef = {
      read: () => '',
      write: () => undefined,
      snippetEntries: [],
      logs: [],
    } as ChatEditorRef;
    const newEditorRef = {
      read: () => '',
      write: () => undefined,
      snippetEntries: [],
      logs: [],
    } as ChatEditorRef;
    const editorState = createEditorToolState('editor-cleanup', oldEditorRef);
    const chatMessageModel = editorState.chatBoxRuntime.chatMessageModel;
    chatMessageModel.setEditorRef('editor-cleanup', newEditorRef);

    chatMessageModel.unregisterEditorRef('editor-cleanup', oldEditorRef);

    expect(chatMessageModel.editorRef['editor-cleanup']).toBe(newEditorRef);
    expect(chatMessageModel.currentEditorRefUid).toBe('editor-cleanup');

    chatMessageModel.unregisterEditorRef('editor-cleanup', newEditorRef);

    expect(chatMessageModel.editorRef['editor-cleanup']).toBeNull();
    expect(chatMessageModel.currentEditorRefUid).toBeNull();
  });

  it('rejects a patch with a bare hunk header without mutating the editor', async () => {
    let code = 'const label = "old";\nctx.render(label);\n';
    const previousState = useChatMessagesStore.getState();
    useChatMessagesStore.setState({
      ...previousState,
      currentEditorRefUid: 'editor-bare-hunk-patch',
      editorRef: {
        'editor-bare-hunk-patch': {
          read: () => code,
          write: (nextCode: string) => {
            code = nextCode;
          },
          snippetEntries: [],
          logs: [],
        } as any,
      },
    });

    try {
      const result = await patchJSCodeTool[1].invoke.call({}, {} as any, {
        patch: `@@
-const label = "old";
+const label = "new";
`,
      });
      const readResult = await readJSCodeTool[1].invoke.call({}, {} as any, {});

      expect(result.status).toBe('error');
      expect(result.content.message).toContain('bare `@@` headers are not supported');
      expect(code).toBe('const label = "old";\nctx.render(label);\n');
      expect(readResult.content.version).toBe(0);
    } finally {
      useChatMessagesStore.setState(previousState, true);
    }
  });

  it('rejects a valid patch that produces no changes', () => {
    const source = 'const label = "old";\n';
    const patch = `@@ -1,1 +1,1 @@
-const label = "old";
+const label = "old";
`;

    expect(() => applyUnifiedDiff(source, patch)).toThrow('Patch produced no changes');
  });

  it('returns a structured error when writeJSCode receives invalid params', async () => {
    let code = 'const value = 1;';
    const editorState = createEditorToolState('editor-invalid-write', {
      read: () => code,
      write: (nextCode: string) => {
        code = nextCode;
      },
      snippetEntries: [],
      logs: [],
    } as ChatEditorRef);

    const result = await writeJSCodeTool[1].invoke.call(editorState, {} as any, {});

    expect(result.status).toBe('error');
    expect(result.content.message).toContain('`code` must be a string');
    expect(code).toBe('const value = 1;');
  });

  it('returns a structured error when patchJSCode receives invalid params', async () => {
    let code = 'const label = "old";\nctx.render(label);\n';
    const editorState = createEditorToolState('editor-invalid-patch', {
      read: () => code,
      write: (nextCode: string) => {
        code = nextCode;
      },
      snippetEntries: [],
      logs: [],
    } as ChatEditorRef);

    const result = await patchJSCodeTool[1].invoke.call(editorState, {} as any, {});

    expect(result.status).toBe('error');
    expect(result.content.message).toContain('`patch` must be a non-empty string');
    expect(code).toBe('const label = "old";\nctx.render(label);\n');
  });

  it('reads the current editor code for patch planning and recovery', async () => {
    const code = 'const value = 1;\nctx.render(value);\n';
    const editorState = createEditorToolState('editor-read', {
      read: () => code,
      write: () => undefined,
      snippetEntries: [],
      logs: [],
    } as ChatEditorRef);

    const result = await readJSCodeTool[1].invoke.call(editorState, {} as any, {});

    expect(result.status).toBe('success');
    expect(result.content.success).toBe(true);
    expect(result.content.code).toBe(code);
    expect(result.content.lineCount).toBe(3);
  });

  it('does not mutate editor code when a patch fails', async () => {
    let code = 'const label = "old";\nctx.render(label);\n';
    const editorState = createEditorToolState('editor-failed-patch', {
      read: () => code,
      write: (nextCode: string) => {
        code = nextCode;
      },
      snippetEntries: [],
      logs: [],
    } as ChatEditorRef);
    const result = await patchJSCodeTool[1].invoke.call(editorState, {} as any, {
      patch: `@@ -1,2 +1,2 @@
-const missing = "old";
+const missing = "new";
 ctx.render(missing);
`,
    });

    expect(result.status).toBe('error');
    expect(result.content.message).toContain('Call readJSCode before retrying');
    expect(code).toBe('const label = "old";\nctx.render(label);\n');
  });
});

describe('tool code card rendering', () => {
  it('skips rendering while streamed args are temporarily invalid', () => {
    const previous = {
      id: 'write-1',
      name: 'writeJSCode',
      args: { code: 'const value = 1;' },
    } as any;
    const next = {
      id: 'write-1',
      name: 'writeJSCode',
      args: '{"code":',
    } as any;

    expect(buildToolCodeBlock(previous)).toEqual({ language: 'js', value: 'const value = 1;' });
    expect(buildToolCodeBlock(next)).toBeNull();
    expect(shouldSkipCodeToolCardRender({ toolCall: previous } as any, { toolCall: next } as any)).toBe(true);
  });

  it('skips rendering while streamed args are empty or truncated', () => {
    const previous = {
      id: 'write-streaming',
      name: 'writeJSCode',
      args: { code: 'const a = 1;\nconst b = 2;\nconst c = 3;' },
    } as any;
    const empty = {
      id: 'write-streaming',
      name: 'writeJSCode',
      args: { code: '' },
    } as any;
    const truncated = {
      id: 'write-streaming',
      name: 'writeJSCode',
      args: { code: 'const a = 1;' },
    } as any;

    expect(buildToolCodeBlock(previous)).toEqual({
      language: 'js',
      value: 'const a = 1;\nconst b = 2;\nconst c = 3;',
    });
    expect(buildToolCodeBlock(empty)).toBeNull();
    expect(buildToolCodeBlock(truncated)).toEqual({ language: 'js', value: 'const a = 1;' });
    expect(shouldSkipCodeToolCardRender({ toolCall: previous } as any, { toolCall: empty } as any)).toBe(true);
    expect(shouldSkipCodeToolCardRender({ toolCall: previous } as any, { toolCall: truncated } as any)).toBe(true);
  });

  it('renders when streamed args become complete enough', () => {
    const previous = {
      id: 'write-streaming',
      name: 'writeJSCode',
      args: { code: 'const a = 1;\nconst b = 2;\nconst c = 3;' },
    } as any;
    const next = {
      id: 'write-streaming',
      name: 'writeJSCode',
      args: { code: 'const a = 1;\nconst b = 2;\nconst c = 3;\nctx.render(c);' },
    } as any;

    expect(shouldSkipCodeToolCardRender({ toolCall: previous } as any, { toolCall: next } as any)).toBe(false);
  });

  it('returns an empty code block instead of undefined before code arrives', () => {
    const result = buildToolCodeBlock({
      id: 'write-2',
      name: 'writeJSCode',
      args: {},
    } as any);

    expect(result).toBeNull();
  });

  it('compacts unchanged delete/add pairs in patch display', () => {
    const result = compactPatchForDisplay(`--- a/code
+++ b/code
@@ -1,7 +1,7 @@
-const a = 1;
+const a = 1;
-const b = 2;
+const b = 3;
-const c = 4;
+const c = 4;
`);

    expect(result).toContain(' const a = 1;');
    expect(result).toContain('-const b = 2;');
    expect(result).toContain('+const b = 3;');
    expect(result).toContain(' const c = 4;');
  });
});
