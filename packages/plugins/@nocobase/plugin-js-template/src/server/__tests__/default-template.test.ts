/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DEFAULT_JS_TEMPLATE_README, createDefaultJsTemplateTemplate } from '../../shared/default-template';
import { createJsTemplateEntryStarter } from '../../shared/jsTemplateEntryStarter';
import type { JsTemplateKind } from '../../shared/types';
import { JsTemplateValidator } from '../services/JsTemplateValidator';
import { JsTemplateWorkspaceCompilerBridge } from '../services/JsTemplateWorkspaceCompilerBridge';

const ENTRY_CASES: Array<{ entryPath: string; kind: JsTemplateKind }> = [
  {
    entryPath: 'src/client/js-blocks/welcome-card/index.tsx',
    kind: 'js-block',
  },
  {
    entryPath: 'src/client/js-actions/refresh-data/index.ts',
    kind: 'js-action',
  },
  {
    entryPath: 'src/client/js-fields/status-tag/index.tsx',
    kind: 'js-field',
  },
  {
    entryPath: 'src/client/js-fields/record-status-column/index.tsx',
    kind: 'js-field',
  },
  {
    entryPath: 'src/client/js-items/form-total-preview/index.tsx',
    kind: 'js-item',
  },
];

type AsyncFunctionConstructor = new (...args: string[]) => (...args: unknown[]) => Promise<unknown>;

const asyncFunctionConstructor = Object.getPrototypeOf(async function runDefaultActionArtifactTest() {})
  .constructor as AsyncFunctionConstructor;

async function executeArtifact(code: string, ctx: unknown): Promise<unknown> {
  return new asyncFunctionConstructor('ctx', code)(ctx);
}

describe('plugin-js-template default source template', () => {
  let refreshActionArtifactCode = '';

  beforeAll(async () => {
    const entryPath = 'src/client/js-actions/refresh-data/index.ts';
    const rootPath = entryPath.slice(0, entryPath.lastIndexOf('/'));
    const result = await new JsTemplateWorkspaceCompilerBridge().compileEntry({
      projectId: 'jtp_default_action',
      kind: 'js-action',
      templateName: 'refresh-data',
      entryPath,
      files: createDefaultJsTemplateTemplate().filter((file) => file.path.startsWith(`${rootPath}/`)),
    });

    expect(result.accepted, JSON.stringify(result.diagnostics, null, 2)).toBe(true);
    expect(result.diagnostics).toEqual([]);
    refreshActionArtifactCode = result.artifact.code;
  });

  it('includes a multi-file entry with a relative import', () => {
    const files = createDefaultJsTemplateTemplate();
    const multiFileEntry = ENTRY_CASES.find(({ entryPath }) => {
      const rootPath = entryPath.slice(0, entryPath.lastIndexOf('/'));
      const entryFiles = files.filter(
        (file) => file.path.startsWith(`${rootPath}/`) && !file.path.endsWith('/entry.json'),
      );
      return entryFiles.length > 1 && entryFiles.some((file) => /from ['"]\.\//u.test(file.content));
    });

    expect(multiFileEntry).toBeDefined();
  });

  it('returns a fresh file array for each project', () => {
    const first = createDefaultJsTemplateTemplate();
    const second = createDefaultJsTemplateTemplate();

    first[0].content = '# Changed\n';
    expect(second[0].content).toBe(DEFAULT_JS_TEMPLATE_README);
  });

  it('compiles every default example with the real compiler', async () => {
    const bridge = new JsTemplateWorkspaceCompilerBridge();
    const files = createDefaultJsTemplateTemplate();

    for (const item of ENTRY_CASES) {
      const rootPath = item.entryPath.slice(0, item.entryPath.lastIndexOf('/'));
      const result = await bridge.compileEntry({
        projectId: 'jtp_default',
        kind: item.kind,
        templateName: rootPath.slice(rootPath.lastIndexOf('/') + 1),
        entryPath: item.entryPath,
        files: files.filter((file) => file.path.startsWith(`${rootPath}/`)),
      });

      expect(result.accepted, `${item.kind}:${item.entryPath}\n${JSON.stringify(result.diagnostics, null, 2)}`).toBe(
        true,
      );
      expect(result.diagnostics).toEqual([]);
      expect(result.artifact?.code).toEqual(expect.stringMatching(/[\s\S]*/u));
    }
  });

  it('executes the compiled refresh-data Action with the Resource receiver', async () => {
    const success = vi.fn();
    const warning = vi.fn();
    const translate = vi.fn((message: string) => `translated:${message}`);
    let completeRefresh: (() => void) | undefined;
    const refreshCompletion = new Promise<void>((resolve) => {
      completeRefresh = resolve;
    });
    const resource = {
      label: 'orders',
      refreshCount: 0,
      refreshCompleted: false,
      refreshedLabel: '',
      async refresh() {
        this.refreshCount += 1;
        this.refreshedLabel = this.label;
        await refreshCompletion;
        this.refreshCompleted = true;
      },
    };

    const execution = executeArtifact(refreshActionArtifactCode, {
      message: { success, warning },
      resource,
      settings: { successMessage: 'Orders refreshed' },
      t: translate,
    });

    expect(resource).toMatchObject({ refreshCount: 1, refreshedLabel: 'orders' });
    expect(warning).not.toHaveBeenCalled();
    expect(success).not.toHaveBeenCalled();

    completeRefresh?.();
    await execution;

    expect(resource.refreshCompleted).toBe(true);
    expect(success).toHaveBeenCalledTimes(1);
    expect(success).toHaveBeenCalledWith('translated:Orders refreshed');
  });

  it.each([
    { label: 'missing Resource', resource: undefined },
    { label: 'Resource without refresh', resource: { label: 'orders' } },
  ])('warns once and returns when $label', async ({ resource }) => {
    const success = vi.fn();
    const warning = vi.fn();
    const translate = vi.fn((message: string) => `translated:${message}`);

    await expect(
      executeArtifact(refreshActionArtifactCode, {
        message: { success, warning },
        resource,
        settings: { successMessage: 'Orders refreshed' },
        t: translate,
      }),
    ).resolves.toBeUndefined();

    expect(warning).toHaveBeenCalledTimes(1);
    expect(warning).toHaveBeenCalledWith('translated:No resource to refresh');
    expect(success).not.toHaveBeenCalled();
  });

  it('does not report success when refresh rejects', async () => {
    const refreshError = new Error('refresh failed');
    const success = vi.fn();
    const warning = vi.fn();
    const resource = {
      refreshAttempts: 0,
      async refresh() {
        this.refreshAttempts += 1;
        throw refreshError;
      },
    };

    await expect(
      executeArtifact(refreshActionArtifactCode, {
        message: { success, warning },
        resource,
        settings: {},
        t: (message: string) => message,
      }),
    ).rejects.toBe(refreshError);

    expect(resource.refreshAttempts).toBe(1);
    expect(warning).not.toHaveBeenCalled();
    expect(success).not.toHaveBeenCalled();
  });

  it('validates and compiles the single-entry starter for all four supported kinds', async () => {
    const bridge = new JsTemplateWorkspaceCompilerBridge();

    for (const kind of new Set(ENTRY_CASES.map((entry) => entry.kind))) {
      const templateName = `starter-${kind}`;
      const files = createJsTemplateEntryStarter({ kind, templateName, title: `Starter ${kind}` });
      const entryFile = files.find((file) => !file.path.endsWith('/entry.json'));

      expect(new JsTemplateValidator().validateInitialFiles({ files }), kind).toEqual([]);
      if (!entryFile) {
        throw new Error(`Starter source file is missing for ${kind}`);
      }

      const result = await bridge.compileEntry({
        projectId: 'jtp_starter',
        kind,
        templateName,
        entryPath: entryFile.path,
        files,
      });

      expect(result.accepted, `${kind}\n${JSON.stringify(result.diagnostics, null, 2)}`).toBe(true);
      expect(result.diagnostics).toEqual([]);
    }
  });
});
