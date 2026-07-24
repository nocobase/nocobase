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
import {
  getChatApplicationKey,
  useChatMessagesStore,
} from '../../../client-v2/ai-employees/chatbox/stores/chat-messages';
import { useChatConversationsStore } from '../../../client-v2/ai-employees/chatbox/stores/chat-conversations';
import type { ChatEditorRef } from '../../../client-v2/ai-employees/types';

const bindSingleFileEditor = (uid: string, editorRef: ChatEditorRef) => {
  useChatConversationsStore.setState({ currentConversation: undefined });
  const app = { name: 'app-a' };
  const applicationKey = getChatApplicationKey(app);
  const store = useChatMessagesStore.getState();
  store.registerEditorRef(applicationKey, uid, editorRef);
  store.bindSessionCodingTarget(undefined, { type: 'single-file', applicationKey, editorUid: uid });
  return app;
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
    const previousState = useChatMessagesStore.getState();
    const app = bindSingleFileEditor('editor-1', {
      read: () => 'ctx.render("ok");',
      write: () => undefined,
      run: async () => {
        runCalls.push('run');
      },
      snippetEntries: [],
      logs: [],
    });

    try {
      const result = await lintAndTestJSTool[1].invoke.call(
        {
          flowContext: {
            previewRunJS: async () => ({
              success: true,
              message: 'RunJS preview succeeded: no issues found. Logs: 0.',
            }),
          },
        },
        app,
        {},
      );

      expect(result.status).toBe('success');
      expect(runCalls).toEqual(['run']);
      expect(result.content.userReminder).toContain('click the save button manually');
    } finally {
      useChatMessagesStore.setState(previousState, true);
    }
  });

  it('validates explicitly provided empty code instead of falling back to the editor', async () => {
    const previewedCode: string[] = [];
    const previousState = useChatMessagesStore.getState();
    const app = bindSingleFileEditor('editor-empty-lint', {
      read: () => 'ctx.render("editor");',
      write: () => undefined,
      run: async () => undefined,
      snippetEntries: [],
      logs: [],
    });

    try {
      const result = await lintAndTestJSTool[1].invoke.call(
        {
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
        app,
        { code: '' },
      );

      expect(result.status).toBe('success');
      expect(previewedCode).toEqual(['']);
      expect(result.content.userReminder).toBeUndefined();
    } finally {
      useChatMessagesStore.setState(previousState, true);
    }
  });

  it('patches the current editor code without requiring model-managed hashes', async () => {
    let code = 'const label = "old";\nctx.render(label);\n';
    const previousState = useChatMessagesStore.getState();
    const app = bindSingleFileEditor('editor-patch', {
      read: () => code,
      write: (nextCode: string) => {
        code = nextCode;
      },
      snippetEntries: [],
      logs: [],
    });

    try {
      const result = await patchJSCodeTool[1].invoke.call({}, app, {
        patch: `@@ -1,2 +1,2 @@
-const label = "old";
+const label = "new";
 ctx.render(label);
`,
        baseHash: 'stale-hash-from-an-older-tool-contract',
      });

      expect(result.status).toBe('success');
      expect(code).toBe('const label = "new";\nctx.render(label);\n');
    } finally {
      useChatMessagesStore.setState(previousState, true);
    }
  });

  it('returns a structured error when writeJSCode receives invalid params', async () => {
    let code = 'const value = 1;';
    const previousState = useChatMessagesStore.getState();
    const app = bindSingleFileEditor('editor-invalid-write', {
      read: () => code,
      write: (nextCode: string) => {
        code = nextCode;
      },
      snippetEntries: [],
      logs: [],
    });

    try {
      const result = await writeJSCodeTool[1].invoke.call({}, app, {});

      expect(result.status).toBe('error');
      expect(result.content.message).toContain('`code` must be a string');
      expect(code).toBe('const value = 1;');
    } finally {
      useChatMessagesStore.setState(previousState, true);
    }
  });

  it('returns a structured error when patchJSCode receives invalid params', async () => {
    let code = 'const label = "old";\nctx.render(label);\n';
    const previousState = useChatMessagesStore.getState();
    const app = bindSingleFileEditor('editor-invalid-patch', {
      read: () => code,
      write: (nextCode: string) => {
        code = nextCode;
      },
      snippetEntries: [],
      logs: [],
    });

    try {
      const result = await patchJSCodeTool[1].invoke.call({}, app, {});

      expect(result.status).toBe('error');
      expect(result.content.message).toContain('`patch` must be a non-empty string');
      expect(code).toBe('const label = "old";\nctx.render(label);\n');
    } finally {
      useChatMessagesStore.setState(previousState, true);
    }
  });

  it('reads the current editor code for patch planning and recovery', async () => {
    const code = 'const value = 1;\nctx.render(value);\n';
    const previousState = useChatMessagesStore.getState();
    const app = bindSingleFileEditor('editor-read', {
      read: () => code,
      write: () => undefined,
      snippetEntries: [],
      logs: [],
    });

    try {
      const result = await readJSCodeTool[1].invoke.call({}, app, {});

      expect(result.status).toBe('success');
      expect(result.content.success).toBe(true);
      expect(result.content.code).toBe(code);
      expect(result.content.lineCount).toBe(3);
    } finally {
      useChatMessagesStore.setState(previousState, true);
    }
  });

  it('does not mutate editor code when a patch fails', async () => {
    let code = 'const label = "old";\nctx.render(label);\n';
    const previousState = useChatMessagesStore.getState();
    const app = bindSingleFileEditor('editor-failed-patch', {
      read: () => code,
      write: (nextCode: string) => {
        code = nextCode;
      },
      snippetEntries: [],
      logs: [],
    });

    try {
      const result = await patchJSCodeTool[1].invoke.call({}, app, {
        patch: `@@ -1,2 +1,2 @@
-const missing = "old";
+const missing = "new";
 ctx.render(missing);
`,
      });

      expect(result.status).toBe('error');
      expect(result.content.message).toContain('Call readJSCode before retrying');
      expect(code).toBe('const label = "old";\nctx.render(label);\n');
    } finally {
      useChatMessagesStore.setState(previousState, true);
    }
  });

  it('resolves the bound editor by session and owning application', async () => {
    const previousState = useChatMessagesStore.getState();
    const firstEditor: ChatEditorRef = {
      read: () => 'app-a code',
      write: () => undefined,
      snippetEntries: [],
      logs: [],
    };
    const secondEditor: ChatEditorRef = {
      read: () => 'app-b code',
      write: () => undefined,
      snippetEntries: [],
      logs: [],
    };
    const firstApp = { name: 'shared-name' };
    const secondApp = { name: 'shared-name' };
    const firstApplicationKey = getChatApplicationKey(firstApp);
    const secondApplicationKey = getChatApplicationKey(secondApp);
    const store = useChatMessagesStore.getState();
    store.registerEditorRef(firstApplicationKey, 'shared-editor', firstEditor);
    store.registerEditorRef(secondApplicationKey, 'shared-editor', secondEditor);
    store.bindSessionCodingTarget('session-a', {
      type: 'single-file',
      applicationKey: firstApplicationKey,
      editorUid: 'shared-editor',
    });
    store.bindSessionCodingTarget('session-b', {
      type: 'single-file',
      applicationKey: secondApplicationKey,
      editorUid: 'shared-editor',
    });

    try {
      useChatConversationsStore.setState({ currentConversation: 'session-a' });
      const firstResult = await readJSCodeTool[1].invoke.call({}, firstApp, {});
      expect(firstResult.content.code).toBe('app-a code');

      const crossApplicationResult = await readJSCodeTool[1].invoke.call({}, secondApp, {});
      expect(crossApplicationResult.status).toBe('error');
      expect(crossApplicationResult.content.message).toContain('different application');

      useChatConversationsStore.setState({ currentConversation: 'session-b' });
      const secondResult = await readJSCodeTool[1].invoke.call({}, secondApp, {});
      expect(secondResult.content.code).toBe('app-b code');
    } finally {
      useChatConversationsStore.setState({ currentConversation: undefined });
      useChatMessagesStore.setState(previousState, true);
    }
  });

  it('keeps read, write, patch, and run operations isolated across two single-file conversations', async () => {
    const previousState = useChatMessagesStore.getState();
    let firstCode = 'const label = "first";\n';
    let secondCode = 'const label = "second";\n';
    const runs: string[] = [];
    const previews: string[] = [];
    const firstApp = { name: 'shared-name' };
    const secondApp = { name: 'shared-name' };
    const firstApplicationKey = getChatApplicationKey(firstApp);
    const secondApplicationKey = getChatApplicationKey(secondApp);
    const store = useChatMessagesStore.getState();
    store.registerEditorRef(firstApplicationKey, 'shared-editor', {
      read: () => firstCode,
      write: (code) => {
        firstCode = code;
      },
      run: async () => {
        runs.push('first');
      },
      snippetEntries: [],
      logs: [],
    });
    store.registerEditorRef(secondApplicationKey, 'shared-editor', {
      read: () => secondCode,
      write: (code) => {
        secondCode = code;
      },
      run: async () => {
        runs.push('second');
      },
      snippetEntries: [],
      logs: [],
    });
    store.bindSessionCodingTarget('session-a', {
      type: 'single-file',
      applicationKey: firstApplicationKey,
      editorUid: 'shared-editor',
    });
    store.bindSessionCodingTarget('session-b', {
      type: 'single-file',
      applicationKey: secondApplicationKey,
      editorUid: 'shared-editor',
    });
    const flowContext = {
      previewRunJS: async (code: string) => {
        previews.push(code);
        return { success: true };
      },
    };

    try {
      useChatConversationsStore.setState({ currentConversation: 'session-a' });
      expect((await readJSCodeTool[1].invoke.call({}, firstApp, {})).content.code).toBe(firstCode);
      expect(
        (await writeJSCodeTool[1].invoke.call({}, firstApp, { code: 'const label = "first-written";\n' })).status,
      ).toBe('success');
      expect(
        (
          await patchJSCodeTool[1].invoke.call({}, firstApp, {
            patch: '@@ -1 +1 @@\n-const label = "first-written";\n+const label = "first-patched";\n',
          })
        ).status,
      ).toBe('success');
      expect((await lintAndTestJSTool[1].invoke.call({ flowContext }, firstApp, {})).status).toBe('success');

      useChatConversationsStore.setState({ currentConversation: 'session-b' });
      expect((await readJSCodeTool[1].invoke.call({}, secondApp, {})).content.code).toBe(secondCode);
      expect(
        (await writeJSCodeTool[1].invoke.call({}, secondApp, { code: 'const label = "second-written";\n' })).status,
      ).toBe('success');
      expect(
        (
          await patchJSCodeTool[1].invoke.call({}, secondApp, {
            patch: '@@ -1 +1 @@\n-const label = "second-written";\n+const label = "second-patched";\n',
          })
        ).status,
      ).toBe('success');
      expect((await lintAndTestJSTool[1].invoke.call({ flowContext }, secondApp, {})).status).toBe('success');

      expect(firstCode).toBe('const label = "first-patched";\n');
      expect(secondCode).toBe('const label = "second-patched";\n');
      expect(previews).toEqual([firstCode, secondCode]);
      expect(runs).toEqual(['first', 'second']);
    } finally {
      useChatConversationsStore.setState({ currentConversation: undefined });
      useChatMessagesStore.setState(previousState, true);
    }
  });

  it('rejects legacy single-file tools for workspace targets without reading, writing, or running code', async () => {
    const previousState = useChatMessagesStore.getState();
    const reads: string[] = [];
    const writes: string[] = [];
    const runs: string[] = [];
    const previews: string[] = [];
    const app = { name: 'app-a' };
    const applicationKey = getChatApplicationKey(app);
    const store = useChatMessagesStore.getState();
    store.registerEditorRef(applicationKey, 'editor-a', {
      read: () => {
        reads.push('read');
        return 'source';
      },
      write: (code) => {
        writes.push(code);
      },
      run: async () => {
        runs.push('run');
      },
      snippetEntries: [],
      logs: [],
    });
    store.bindSessionCodingTarget(undefined, {
      type: 'workspace',
      applicationKey,
      surfaceId: 'workspace-a',
      kind: 'light-extension',
      title: 'Workspace A',
    });
    const flowContext = {
      previewRunJS: async (code: string) => {
        previews.push(code);
        return { success: true };
      },
    };

    try {
      const results = await Promise.all([
        readJSCodeTool[1].invoke.call({}, app, {}),
        writeJSCodeTool[1].invoke.call({}, app, { code: 'next' }),
        patchJSCodeTool[1].invoke.call({}, app, { patch: '@@ -1 +1 @@\n-old\n+new\n' }),
        lintAndTestJSTool[1].invoke.call({ flowContext }, app, { code: 'explicit code' }),
      ]);

      for (const result of results) {
        expect(result.status).toBe('error');
        expect(result.content.message).toContain('Workspace tools');
      }
      expect(reads).toEqual([]);
      expect(writes).toEqual([]);
      expect(runs).toEqual([]);
      expect(previews).toEqual([]);
    } finally {
      useChatMessagesStore.setState(previousState, true);
    }
  });

  it('preserves explicit linting without a mounted single-file editor', async () => {
    const previousState = useChatMessagesStore.getState();
    useChatMessagesStore.getState().resetSessionState(undefined);
    const previewedCode: string[] = [];

    try {
      const result = await lintAndTestJSTool[1].invoke.call(
        {
          flowContext: {
            previewRunJS: async (code: string) => {
              previewedCode.push(code);
              return { success: true };
            },
          },
        },
        { name: 'app-a' },
        { code: 'const explicit = true;' },
      );

      expect(result.status).toBe('success');
      expect(previewedCode).toEqual(['const explicit = true;']);
    } finally {
      useChatMessagesStore.setState(previousState, true);
    }
  });

  it('returns unavailable after unmount and resolves the same bound editor after remount', async () => {
    const previousState = useChatMessagesStore.getState();
    const firstEditor: ChatEditorRef = {
      read: () => 'first mount',
      write: () => undefined,
      snippetEntries: [],
      logs: [],
    };
    const secondEditor: ChatEditorRef = {
      read: () => 'second mount',
      write: () => undefined,
      snippetEntries: [],
      logs: [],
    };
    const app = { name: 'app-a' };
    const applicationKey = getChatApplicationKey(app);
    const store = useChatMessagesStore.getState();
    const unregister = store.registerEditorRef(applicationKey, 'editor-a', firstEditor);
    store.bindSessionCodingTarget(undefined, {
      type: 'single-file',
      applicationKey,
      editorUid: 'editor-a',
    });

    try {
      unregister();
      const unavailable = await readJSCodeTool[1].invoke.call({}, app, {});
      expect(unavailable.status).toBe('error');
      expect(unavailable.content.message).toContain('not available');

      store.registerEditorRef(applicationKey, 'editor-a', secondEditor);
      const remounted = await readJSCodeTool[1].invoke.call({}, app, {});
      expect(remounted.status).toBe('success');
      expect(remounted.content.code).toBe('second mount');
    } finally {
      useChatMessagesStore.setState(previousState, true);
    }
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
