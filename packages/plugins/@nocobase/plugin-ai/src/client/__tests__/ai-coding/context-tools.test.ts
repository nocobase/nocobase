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
} from '../../ai-employees/ai-coding/tools/context-tools';
import {
  buildToolCodeBlock,
  compactPatchForDisplay,
  shouldSkipCodeToolCardRender,
} from '../../ai-employees/ai-coding/ui/CodeToolCard';
import { useChatMessagesStore } from '../../ai-employees/chatbox/stores/chat-messages';

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
    useChatMessagesStore.setState({
      ...previousState,
      currentEditorRefUid: 'editor-1',
      editorRef: {
        'editor-1': {
          read: () => 'ctx.render("ok");',
          write: () => undefined,
          run: async () => {
            runCalls.push('run');
          },
          snippetEntries: [],
          logs: [],
        } as any,
      },
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
        {} as any,
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
    useChatMessagesStore.setState({
      ...previousState,
      currentEditorRefUid: 'editor-empty-lint',
      editorRef: {
        'editor-empty-lint': {
          read: () => 'ctx.render("editor");',
          write: () => undefined,
          run: async () => undefined,
          snippetEntries: [],
          logs: [],
        } as any,
      },
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
        {} as any,
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
    useChatMessagesStore.setState({
      ...previousState,
      currentEditorRefUid: 'editor-patch',
      editorRef: {
        'editor-patch': {
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
    useChatMessagesStore.setState({
      ...previousState,
      currentEditorRefUid: 'editor-invalid-write',
      editorRef: {
        'editor-invalid-write': {
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
      const result = await writeJSCodeTool[1].invoke.call({}, {} as any, {});

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
    useChatMessagesStore.setState({
      ...previousState,
      currentEditorRefUid: 'editor-invalid-patch',
      editorRef: {
        'editor-invalid-patch': {
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
      const result = await patchJSCodeTool[1].invoke.call({}, {} as any, {});

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
    useChatMessagesStore.setState({
      ...previousState,
      currentEditorRefUid: 'editor-read',
      editorRef: {
        'editor-read': {
          read: () => code,
          write: () => undefined,
          snippetEntries: [],
          logs: [],
        } as any,
      },
    });

    try {
      const result = await readJSCodeTool[1].invoke.call({}, {} as any, {});

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
    useChatMessagesStore.setState({
      ...previousState,
      currentEditorRefUid: 'editor-failed-patch',
      editorRef: {
        'editor-failed-patch': {
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
