/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  CodeAuthoringChange,
  CodeAuthoringFile,
  CodeAuthoringSnapshot,
  CodeAuthoringSurface,
  PreparedCodeAuthoringChangeSet,
} from '@nocobase/client-v2';
import { CodeAuthoringSurfaceRegistry } from '@nocobase/client-v2';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CodeWorkspaceContext } from '../ai-employees/context/code-workspace';
import { parseWorkContext } from '../ai-employees/chatbox/utils';
import { useChatConversationsStore } from '../ai-employees/chatbox/stores/chat-conversations';
import {
  CHAT_DEFAULT_SESSION_KEY,
  getChatApplicationKey,
  restoreSessionWorkspaceCodingTargetFromMessages,
  useChatMessagesStore,
} from '../ai-employees/chatbox/stores/chat-messages';
import { lintAndTestJSTool, patchJSCodeTool, readJSCodeTool, writeJSCodeTool } from '../ai-employees/tools/ai-coding';
import { WORKSPACE_AUTHORING_TOOL_NAMES } from '../ai-employees/tools/workspace-authoring';
import { AIManager } from '../manager/ai-manager';
import { registerWorkspaceAuthoringSurfaceCleanup } from '../plugin';

type TestWorkspace = {
  surface: CodeAuthoringSurface;
  getFiles: () => Record<string, string>;
  commit: ReturnType<typeof vi.fn>;
};

function createTestWorkspace(surfaceId: string, initialContent: string): TestWorkspace {
  let revision = 1;
  let files = new Map<string, string>([['src/index.ts', initialContent]]);
  let planSequence = 0;
  const plans = new Map<string, { baseSnapshotId: string; changes: CodeAuthoringChange[]; consumed: boolean }>();
  const commit = vi.fn();

  const snapshot = (): CodeAuthoringSnapshot => ({
    surfaceId,
    kind: 'integration-workspace',
    title: surfaceId,
    scope: { type: 'integration', id: surfaceId },
    snapshotId: `${surfaceId}:revision:${revision}`,
    activePath: 'src/index.ts',
    files: Array.from(files, ([path, content]) => ({
      path,
      content,
      language: 'typescript',
      hash: `${path}:${content}`,
      kind: 'source' as const,
      writable: true,
      persisted: true,
      size: content.length,
    })).map(({ content: _content, ...metadata }) => metadata),
    diagnostics: [],
    capabilities: {
      describe: true,
      listFiles: true,
      readFiles: true,
      search: true,
      prepareChanges: true,
      applyPreparedChanges: true,
      validateDraft: true,
      reveal: true,
      supportedChanges: ['create', 'update', 'patch', 'delete'],
    },
  });

  const readFiles = (paths: string[]): CodeAuthoringFile[] =>
    paths.flatMap((path) => {
      const content = files.get(path);
      if (content === undefined) {
        return [];
      }
      return [
        {
          path,
          content,
          language: 'typescript',
          hash: `${path}:${content}`,
          kind: 'source',
          writable: true,
          persisted: true,
          size: content.length,
        },
      ];
    });

  const surface: CodeAuthoringSurface = {
    id: surfaceId,
    describe: async () => snapshot(),
    getSnapshot: async () => snapshot(),
    list: async () => snapshot().files,
    read: async (paths) => readFiles(paths),
    search: async ({ query }) =>
      Array.from(files, ([path, content]) => ({ path, content }))
        .filter(({ content }) => content.includes(query))
        .map(({ path, content }) => ({ path, line: 1, column: content.indexOf(query) + 1, preview: content })),
    prepareChanges: async (input): Promise<PreparedCodeAuthoringChangeSet> => {
      if (input.baseSnapshotId !== snapshot().snapshotId) {
        throw new Error('STALE_SNAPSHOT');
      }
      const planId = `${surfaceId}:plan:${(planSequence += 1)}`;
      plans.set(planId, { baseSnapshotId: input.baseSnapshotId, changes: input.changes, consumed: false });
      return {
        planId,
        surfaceId,
        baseSnapshotId: input.baseSnapshotId,
        changes: input.changes,
        diffs: input.changes.map((change) => ({
          path: change.path,
          status: change.type === 'create' ? 'created' : change.type === 'delete' ? 'deleted' : 'modified',
          before: files.get(change.path),
          after: change.type === 'delete' || change.type === 'patch' ? undefined : change.content,
        })),
        warnings: [],
        createdAt: 1,
        expiresAt: 2,
        saved: false,
      };
    },
    applyPreparedChanges: async (planId) => {
      const plan = plans.get(planId);
      if (!plan || plan.consumed) {
        throw new Error('PLAN_NOT_FOUND');
      }
      if (plan.baseSnapshotId !== snapshot().snapshotId) {
        throw new Error('STALE_SNAPSHOT');
      }
      const nextFiles = new Map(files);
      for (const change of plan.changes) {
        if (change.type === 'delete') {
          nextFiles.delete(change.path);
        } else if (change.type !== 'patch') {
          nextFiles.set(change.path, change.content);
        }
      }
      files = nextFiles;
      revision += 1;
      plan.consumed = true;
      commit(planId);
      return { surfaceId, snapshot: snapshot(), changedPaths: plan.changes.map((change) => change.path), saved: false };
    },
    validateDraft: async () => ({
      surfaceId,
      snapshotId: snapshot().snapshotId,
      diagnostics: [],
      stale: false,
      saved: false,
    }),
    reveal: async () => undefined,
  };

  return { surface, getFiles: () => Object.fromEntries(files), commit };
}

function resetChatStores() {
  useChatMessagesStore.setState({
    sessions: {
      [CHAT_DEFAULT_SESSION_KEY]: useChatMessagesStore.getState().getSessionState('__missing__'),
    },
    editorRef: {},
  });
  useChatConversationsStore.setState({ currentConversation: undefined });
}

describe('workspace authoring integration', () => {
  let authoringSurfaces: CodeAuthoringSurfaceRegistry;
  let aiManager: AIManager;
  let app: {
    name: string;
    aiManager: { authoringSurfaces: CodeAuthoringSurfaceRegistry };
    pm: { get: (name: string) => unknown };
  };
  let stopCleanup: () => void;

  beforeEach(() => {
    resetChatStores();
    authoringSurfaces = new CodeAuthoringSurfaceRegistry();
    aiManager = new AIManager();
    aiManager.registerWorkContext('code-workspace', CodeWorkspaceContext);
    app = {
      name: 'integration-app',
      aiManager: { authoringSurfaces },
      pm: { get: (name) => (name === 'ai' ? { aiManager } : undefined) },
    };
    stopCleanup = registerWorkspaceAuthoringSurfaceCleanup(authoringSurfaces, aiManager.frontendTools);
  });

  afterEach(() => {
    stopCleanup();
    authoringSurfaces.clear();
    resetChatStores();
  });

  it('binds a conversation to one catalog and completes prepare, ASK apply, and validate without saving', async () => {
    const workspace = createTestWorkspace('workspace-a', 'export const value = 1;');
    authoringSurfaces.register(workspace.surface);
    const applicationKey = getChatApplicationKey(app);
    const store = useChatMessagesStore.getState();
    const target = {
      type: 'workspace' as const,
      applicationKey,
      surfaceId: workspace.surface.id,
      kind: 'integration-workspace',
      title: 'Workspace A',
    };
    expect(store.bindSessionCodingTarget('session-a', target).status).toBe('bound');
    store.setSessionContextItems('session-a', [
      {
        type: 'code-workspace',
        uid: workspace.surface.id,
        title: 'Workspace A',
        content: { surfaceId: workspace.surface.id, title: 'lightweight context' },
      },
    ]);

    const parsed = await parseWorkContext(app, store.getSessionState('session-a').contextItems);
    const catalog = parsed[0].frontendTools || [];
    expect(parsed[0].content).toMatchObject({ surfaceId: 'workspace-a', snapshotId: 'workspace-a:revision:1' });
    expect(catalog).toHaveLength(7);
    expect(catalog.find((tool) => tool.name === WORKSPACE_AUTHORING_TOOL_NAMES.applyPreparedChanges)).toMatchObject({
      permission: 'ASK',
      inputSchema: {
        required: ['planId'],
        properties: { planId: expect.any(Object) },
        additionalProperties: false,
      },
    });

    const prepareResult = await aiManager.frontendTools.execute('workspace-a:workspacePrepareChanges', {
      baseSnapshotId: 'workspace-a:revision:1',
      changes: [
        {
          type: 'update',
          path: 'src/index.ts',
          baseHash: 'src/index.ts:export const value = 1;',
          content: "import { helper } from './helper';\nexport const value = helper;",
        },
        { type: 'create', path: 'src/helper.ts', content: 'export const helper = 2;', language: 'typescript' },
      ],
    });
    expect(prepareResult).toMatchObject({ status: 'success', content: { saved: false, diffs: expect.any(Array) } });
    expect(workspace.getFiles()).toEqual({ 'src/index.ts': 'export const value = 1;' });
    expect(workspace.commit).not.toHaveBeenCalled();

    const planId = (prepareResult as { content: { planId: string } }).content.planId;
    const applyResult = await aiManager.frontendTools.execute('workspace-a:workspaceApplyPreparedChanges', { planId });
    expect(applyResult).toMatchObject({
      status: 'success',
      content: { changedPaths: ['src/index.ts', 'src/helper.ts'], saved: false },
    });
    expect(workspace.commit).toHaveBeenCalledTimes(1);
    expect(workspace.getFiles()).toEqual({
      'src/index.ts': "import { helper } from './helper';\nexport const value = helper;",
      'src/helper.ts': 'export const helper = 2;',
    });

    await expect(aiManager.frontendTools.execute('workspace-a:workspaceValidateDraft', {})).resolves.toMatchObject({
      status: 'success',
      content: { diagnostics: [], stale: false, saved: false },
    });
    expect(Object.values(WORKSPACE_AUTHORING_TOOL_NAMES)).not.toEqual(
      expect.arrayContaining(['workspaceRunPreview', 'workspaceSave']),
    );

    expect(
      store.bindSessionCodingTarget('session-a', {
        ...target,
        surfaceId: 'workspace-b',
        title: 'Workspace B',
      }),
    ).toMatchObject({ status: 'mismatch', requestedTarget: { surfaceId: 'workspace-b' } });
    expect(store.getSessionState('session-a').codingTarget).toMatchObject({ surfaceId: 'workspace-a' });
  });

  it('keeps two conversations isolated across activation, unmount, and same-id remount', async () => {
    const first = createTestWorkspace('workspace-a', 'export const target = "A";');
    const second = createTestWorkspace('workspace-b', 'export const target = "B";');
    const unregisterFirst = authoringSurfaces.register(first.surface);
    authoringSurfaces.register(second.surface);

    const store = useChatMessagesStore.getState();
    const applicationKey = getChatApplicationKey(app);
    for (const [sessionId, surfaceId] of [
      ['session-a', 'workspace-a'],
      ['session-b', 'workspace-b'],
    ] as const) {
      expect(
        store.bindSessionCodingTarget(sessionId, {
          type: 'workspace',
          applicationKey,
          surfaceId,
          kind: 'integration-workspace',
          title: surfaceId,
        }).status,
      ).toBe('bound');
      const contextItems = [{ type: 'code-workspace', uid: surfaceId, content: { surfaceId } }];
      store.setSessionContextItems(sessionId, contextItems);
      const parsed = await parseWorkContext(app, contextItems);
      expect(parsed[0].frontendTools?.every((tool) => tool.blockUid === surfaceId)).toBe(true);
    }
    authoringSurfaces.activate('workspace-a');
    authoringSurfaces.activate('workspace-b');

    const prepared = await aiManager.frontendTools.execute('workspace-a:workspacePrepareChanges', {
      baseSnapshotId: 'workspace-a:revision:1',
      changes: [
        {
          type: 'update',
          path: 'src/index.ts',
          baseHash: 'src/index.ts:export const target = "A";',
          content: 'export const target = "A-updated";',
        },
      ],
    });
    const planId = (prepared as { content: { planId: string } }).content.planId;
    await aiManager.frontendTools.execute('workspace-a:workspaceApplyPreparedChanges', { planId });
    expect(first.getFiles()['src/index.ts']).toBe('export const target = "A-updated";');
    expect(second.getFiles()['src/index.ts']).toBe('export const target = "B";');
    expect(store.getSessionState('session-a').codingTarget).toMatchObject({ surfaceId: 'workspace-a' });
    expect(store.getSessionState('session-b').codingTarget).toMatchObject({ surfaceId: 'workspace-b' });

    unregisterFirst();
    await expect(aiManager.frontendTools.execute('workspace-a:workspaceDescribe', {})).rejects.toThrow('unavailable');
    const secondPrepared = await aiManager.frontendTools.execute('workspace-b:workspacePrepareChanges', {
      baseSnapshotId: 'workspace-b:revision:1',
      changes: [
        {
          type: 'update',
          path: 'src/index.ts',
          baseHash: 'src/index.ts:export const target = "B";',
          content: 'export const target = "B-updated-after-a-unmount";',
        },
      ],
    });
    const secondPlanId = (secondPrepared as { content: { planId: string } }).content.planId;
    await expect(
      aiManager.frontendTools.execute('workspace-b:workspaceApplyPreparedChanges', { planId: secondPlanId }),
    ).resolves.toMatchObject({
      status: 'success',
      content: { surfaceId: 'workspace-b', changedPaths: ['src/index.ts'], saved: false },
    });
    expect(first.getFiles()['src/index.ts']).toBe('export const target = "A-updated";');
    expect(second.getFiles()['src/index.ts']).toBe('export const target = "B-updated-after-a-unmount";');

    const remounted = createTestWorkspace('workspace-a', 'export const target = "A-remounted";');
    authoringSurfaces.register(remounted.surface);
    await parseWorkContext(app, [
      { type: 'code-workspace', uid: 'workspace-a', content: { surfaceId: 'workspace-a' } },
    ]);
    await expect(aiManager.frontendTools.execute('workspace-a:workspaceDescribe', {})).resolves.toMatchObject({
      status: 'success',
      content: { snapshotId: 'workspace-a:revision:1' },
    });
    expect(first.commit).toHaveBeenCalledTimes(1);
    expect(remounted.commit).not.toHaveBeenCalled();
    expect(store.getSessionState('session-a').codingTarget).toMatchObject({ surfaceId: 'workspace-a' });
    expect(store.getSessionState('session-b').codingTarget).toMatchObject({ surfaceId: 'workspace-b' });
  });

  it('restores a persisted workspace target and blocks every legacy single-file coding tool', async () => {
    const workspace = createTestWorkspace('workspace-a', 'export const value = 1;');
    authoringSurfaces.register(workspace.surface);
    const store = useChatMessagesStore.getState();
    restoreSessionWorkspaceCodingTargetFromMessages('session-a', getChatApplicationKey(app), [
      {
        role: 'user',
        content: {
          content: 'Update the workspace',
          workContext: [
            {
              type: 'code-workspace',
              uid: 'workspace-a',
              title: 'Workspace A',
              content: { surfaceId: 'workspace-a', kind: 'integration-workspace', title: 'Workspace A' },
            },
          ],
        },
      },
    ]);
    useChatConversationsStore.setState({ currentConversation: 'session-a' });
    const previewRunJS = vi.fn();
    const legacyApp = app as typeof app & { flowEngine: { context: { previewRunJS: typeof previewRunJS } } };
    legacyApp.flowEngine = { context: { previewRunJS } };

    const legacyTools = [readJSCodeTool, writeJSCodeTool, patchJSCodeTool, lintAndTestJSTool];
    for (const [name, tool] of legacyTools) {
      const args = name === 'lintAndTestJS' ? { code: 'return dangerousCode;' } : {};
      await expect(tool.invoke?.(legacyApp as never, args)).resolves.toMatchObject({
        status: 'error',
        content: { success: false, message: expect.stringContaining('Please use Workspace tools instead') },
      });
    }
    expect(previewRunJS).not.toHaveBeenCalled();
    expect(workspace.commit).not.toHaveBeenCalled();
  });
});
