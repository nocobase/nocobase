/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LIGHT_EXTENSION_ACL_SNIPPET, LIGHT_EXTENSION_SETTINGS_KEY, NAMESPACE } from '../../constants';
import { type LightExtensionRuntimeSourceBinding } from '../../shared/types';
import {
  JSBlockLightExtensionSourceField,
  JSPageLightExtensionSourceField,
} from '../components/JSBlockLightExtensionSourceField';
import { JS_TEMPLATE_SETTINGS_KEY } from '../jsTemplateV2UIContract';
import PluginLightExtensionClientV2 from '../plugin';
import { createForm } from '@formily/core';
import { createSchemaField, FormProvider } from '@formily/react';
import { createMockClient } from '@nocobase/client-v2';
import { FlowEngine, FlowEngineProvider } from '@nocobase/flow-engine';
import { defineSettings } from '@nocobase/js-template-sdk/client';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Modal } from 'antd';
import fs from 'fs';
import path from 'path';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
  t: vi.fn((key: string) => key),
}));

vi.mock('react-i18next', async () => {
  const actual = await vi.importActual<typeof import('react-i18next')>('react-i18next');
  return {
    ...actual,
    useTranslation: () => ({
      t: mocks.t,
    }),
  };
});

// Consolidated from runjs-source-resolver-runtime-boundary.cases.tsx.
function registerRuntimeBoundaryTests() {
  describe('plugin-light-extension client-v2 boundary', () => {
    it('registers canonical and legacy v2 settings routes with one implementation and ACL', async () => {
      const app = createMockClient({
        plugins: [
          [
            PluginLightExtensionClientV2,
            {
              name: 'light-extension',
              packageName: NAMESPACE,
            },
          ],
        ],
      });

      await app.load();

      const canonicalPage = app.pluginSettingsManager.get(`${JS_TEMPLATE_SETTINGS_KEY}.index`, false);
      const legacyPage = app.pluginSettingsManager.get(`${LIGHT_EXTENSION_SETTINGS_KEY}.index`, false);
      expect(app.pluginSettingsManager.get(JS_TEMPLATE_SETTINGS_KEY, false)).toMatchObject({
        key: JS_TEMPLATE_SETTINGS_KEY,
        title: 'JS Templates',
        aclSnippet: LIGHT_EXTENSION_ACL_SNIPPET,
        showTabs: false,
      });
      expect(canonicalPage).toMatchObject({
        menuKey: JS_TEMPLATE_SETTINGS_KEY,
        pageKey: 'index',
        componentLoader: expect.any(Function),
        aclSnippet: LIGHT_EXTENSION_ACL_SNIPPET,
      });
      expect(app.pluginSettingsManager.get(LIGHT_EXTENSION_SETTINGS_KEY, false)).toMatchObject({
        key: LIGHT_EXTENSION_SETTINGS_KEY,
        title: 'JS Templates',
        aclSnippet: LIGHT_EXTENSION_ACL_SNIPPET,
        hidden: true,
        showTabs: false,
      });
      expect(legacyPage).toMatchObject({
        menuKey: LIGHT_EXTENSION_SETTINGS_KEY,
        pageKey: 'index',
        componentLoader: expect.any(Function),
        aclSnippet: LIGHT_EXTENSION_ACL_SNIPPET,
        hidden: true,
      });
      expect(canonicalPage?.componentLoader).toBe(legacyPage?.componentLoader);
      expect(app.pluginSettingsManager.get(`${LIGHT_EXTENSION_SETTINGS_KEY}.source`, false)).toBeNull();
      expect(app.pluginSettingsManager.get(`${LIGHT_EXTENSION_SETTINGS_KEY}.entries`, false)).toBeNull();
      expect(app.pluginSettingsManager.get(`${LIGHT_EXTENSION_SETTINGS_KEY}.references`, false)).toBeNull();
    });

    it('keeps client-v2 code out of the legacy client runtime', () => {
      const files = collectSourceFilesFromDirectories([
        path.resolve(__dirname, '..'),
        path.resolve(__dirname, '../../client-shared'),
      ]);
      const violations = files.flatMap((file) => {
        const source = fs.readFileSync(file, 'utf8');
        const importsLegacyClient = /from\s+['"]@nocobase\/client['"]|require\(['"]@nocobase\/client['"]\)/.test(
          source,
        );
        return importsLegacyClient ? [path.relative(process.cwd(), file)] : [];
      });

      expect(violations).toEqual([]);
    });

    it('exposes only the minimal SDK helper at runtime', () => {
      const settings = { title: 'Sales KPI' };

      expect(defineSettings(settings)).toBe(settings);

      const sdkSource = fs.readFileSync(
        path.resolve(__dirname, '../../../../../../core/js-template-sdk/src/client/index.ts'),
        'utf8',
      );
      expect(sdkSource).not.toMatch(
        /defineClientExtension|defineServerExtension|registerBlock|registerAction|registerResource/,
      );
      expect(sdkSource).toMatch(/JSBlockContext|RunJSContext/);
      expect(sdkSource).not.toMatch(/getVar|getValue|setValue/);
    });

    it('uses the standalone SDK package instead of plugin-local SDK shims', () => {
      const pluginRoot = path.resolve(__dirname, '../../..');
      const sdkRoot = path.resolve(pluginRoot, '../../../core/js-template-sdk');
      const rootSource = fs.readFileSync(path.resolve(__dirname, '../../index.ts'), 'utf8');
      const packageJson = JSON.parse(fs.readFileSync(path.join(pluginRoot, 'package.json'), 'utf8')) as {
        exports: Record<string, { import?: string; types?: string } | string>;
        dependencies: Record<string, string>;
      };
      const sdkPackageJson = JSON.parse(fs.readFileSync(path.join(sdkRoot, 'package.json'), 'utf8')) as {
        exports: Record<string, { import?: string; types?: string } | string>;
      };

      expect(rootSource).not.toContain('./sdk/client');
      expect(packageJson.exports['./client']).toMatchObject({
        types: './client.d.ts',
        import: './client.js',
      });
      expect(packageJson.exports['./client-v2']).toMatchObject({
        types: './client-v2.d.ts',
        import: './client-v2.js',
      });
      expect(packageJson.exports['./sdk/client']).toBeUndefined();
      expect(packageJson.exports['./sdk/shared']).toBeUndefined();
      expect(packageJson.dependencies['@nocobase/js-template-sdk']).toBeDefined();
      expect(sdkPackageJson.exports['./client']).toBeDefined();
      expect(sdkPackageJson.exports['./shared']).toBeDefined();
      expect(sdkPackageJson.exports['./typegen']).toBeDefined();
      expect(collectSourceFiles(path.join(pluginRoot, 'src/sdk'))).toEqual([]);
      expect(fs.existsSync(path.join(pluginRoot, 'client.js'))).toBe(true);
      expect(fs.existsSync(path.join(pluginRoot, 'client-v2.js'))).toBe(true);
      expect(fs.existsSync(path.join(pluginRoot, 'server.js'))).toBe(true);
    });

    it('keeps authoring-only pages out of the legacy client while sharing canonical integration installers', () => {
      const pluginSource = fs.readFileSync(path.resolve(__dirname, '../plugin.tsx'), 'utf8');

      expect(pluginSource).toContain('installJsTemplateRunJSIntegrations');
      expect(pluginSource).toContain('registerJsTemplateRunJSFlowSettingsComponents');
      expect(pluginSource).not.toContain('EntryReferencesPanel');

      const legacySource = fs.readFileSync(path.resolve(__dirname, '../../client/index.ts'), 'utf8');
      expect(legacySource).toContain('installJsTemplateRunJSIntegrations');
      expect(legacySource).toContain('registerJsTemplateRunJSFlowSettingsComponents');
      expect(legacySource).not.toContain('RunJSSourceResolverRegistry');
      expect(legacySource).not.toContain('JS_BLOCK_LIGHT_EXTENSION_FULL_SOURCE_FIELD');
      expect(legacySource).not.toContain('EntryReferencesPanel');
    });
  });

  function collectSourceFilesFromDirectories(directories: string[]): string[] {
    return directories.flatMap((directory) => collectSourceFiles(directory));
  }

  function collectSourceFiles(directory: string): string[] {
    if (!fs.existsSync(directory)) {
      return [];
    }
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        return entry.name === '__tests__' ? [] : collectSourceFiles(entryPath);
      }
      return /\.(ts|tsx)$/.test(entry.name) ? [entryPath] : [];
    });
  }
}
registerRuntimeBoundaryTests();

// Consolidated from runjs-source-resolver-source-mode-roundtrip.cases.tsx.
function registerSourceModeRoundTripTests() {
  // Old case -> new owner:
  // inline-preserve-code / does not clear inline fallback... -> preserves the inline fallback when first selecting an entry.
  // save-without-clearing-inline / keeps existing JS Block inline code... -> mounts the JS Block binding editor without mutating the snapshot.
  // save-without-clearing-inline / renders as a JS Block binding editor... -> mounts the JS Block binding editor without mutating the snapshot.
  // save-without-clearing-inline / keeps the complete JS Page inline snapshot... -> renders the binding-only editor without mutating the snapshot.
  // mode-switch-copyback / requires confirmation and copies current runtime code... -> copies current runtime code when switching inline.
  // New owner: returning to the same external binding preserves the complete inline settings snapshot.
  // New owners: resolve and artifact-copy failures each preserve the external binding and fallback snapshot.

  const artifactHash = 'a'.repeat(64);

  const SchemaField = createSchemaField({
    components: {
      JSBlockLightExtensionSourceField,
      JSPageLightExtensionSourceField,
    },
  });

  type SourceFieldComponent = 'JSBlockLightExtensionSourceField' | 'JSPageLightExtensionSourceField';

  type RunJSFormValues = {
    sourceMode: string;
    code: string;
    version: string;
    settings: Record<string, unknown>;
    sourceRef: Record<string, unknown>;
    sourceBinding?: LightExtensionRuntimeSourceBinding;
  };

  const sourceBinding: LightExtensionRuntimeSourceBinding = {
    type: 'light-extension-entry',
    repoId: 'repo_sales',
    entryId: 'entry_sales',
    kind: 'js-page',
  };

  const entry = {
    id: 'entry_sales',
    repoId: 'repo_sales',
    target: 'client',
    kind: 'js-page',
    entryName: 'sales',
    entryPath: 'src/client/js-pages/sales/index.tsx',
    descriptorPath: 'src/client/js-pages/sales/entry.json',
    title: 'Sales',
    description: null,
    category: null,
    icon: null,
    tags: null,
    sort: null,
    runtimeAvailable: true,
    settingsSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', default: 'Sales' },
      },
    },
    settingsSchemaHash: 'settings_schema_hash',
    compiledCommitId: 'commit_sales',
    runtimeArtifact: {
      code: 'ctx.render("sales");',
      version: 'v2',
      entryPath: 'src/client/js-pages/sales/index.tsx',
    },
    runtimeVersion: 'v2',
    surfaceStyle: 'render',
    runtimeCodeHash: 'runtime_hash',
    filesHash: 'files_hash',
    settingsDefaultsHash: 'settings_defaults_hash',
    compiledAt: '2026-07-09T00:00:00.000Z',
    healthStatus: 'ready',
    diagnostics: [],
  };

  describe('source mode round-trip compatibility', () => {
    beforeEach(() => {
      mocks.request.mockReset();
      mocks.request.mockImplementation(successfulRequest);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('preserves the inline fallback when first selecting a light extension entry', async () => {
      const form = createRunJSForm({ sourceMode: 'inline', sourceBinding: undefined, settings: {} });
      renderSourceModeField(form);

      await selectCodeSource('sales');

      expect(form.values).toMatchObject({
        sourceMode: 'light-extension',
        sourceBinding: {
          type: 'light-extension-entry',
          repoId: 'repo_sales',
          entryId: 'entry_sales',
          entryName: 'sales',
          entryPath: 'src/client/js-pages/sales/index.tsx',
          kind: 'js-page',
        },
        code: 'ctx.render("old inline");',
        version: 'v1',
        settings: {},
        sourceRef: {
          type: 'vsc-file',
          repoId: 'old_inline_repo',
          commitId: 'old_inline_commit',
          entry: 'src/client/index.tsx',
        },
      });
      expect(mocks.request).toHaveBeenCalledWith(
        expect.objectContaining({ url: 'lightExtensionEntries:listSelectable' }),
      );
      expect(
        mocks.request.mock.calls.every(([options]) => options.url === 'lightExtensionEntries:listSelectable'),
      ).toBe(true);
    });

    it('preserves the complete inline snapshot when returning to the same external binding', async () => {
      const form = createRunJSForm({ sourceMode: 'inline' });
      const inlineSnapshot = cloneValues(form.values);

      renderSourceModeField(form);
      await selectCodeSource('sales');

      expect(form.values).toMatchObject({
        sourceMode: 'light-extension',
        code: inlineSnapshot.code,
        version: inlineSnapshot.version,
        settings: inlineSnapshot.settings,
        sourceRef: inlineSnapshot.sourceRef,
        sourceBinding: expect.objectContaining({
          type: 'light-extension-entry',
          repoId: sourceBinding.repoId,
          entryId: sourceBinding.entryId,
          kind: sourceBinding.kind,
        }),
      });
    });

    it('renders the binding-only editor without mutating the complete inline snapshot', async () => {
      const form = createRunJSForm();
      const originalValues = cloneValues(form.values);

      renderSourceBindingField(form);

      await waitFor(() => expect(screen.getByText('Required settings are complete')).toBeTruthy());
      expect(screen.queryByText('title')).toBeNull();
      expect(screen.queryByText('Inline code')).toBeNull();
      expect(screen.queryByText('Copy selected JS Template code')).toBeNull();
      expect(form.values).toEqual(originalValues);
    });

    it('mounts the JS Block binding editor without mutating its inline fallback snapshot', async () => {
      const blockBinding: LightExtensionRuntimeSourceBinding = {
        ...sourceBinding,
        kind: 'js-block',
      };
      mocks.request.mockImplementation((options: { url: string }) => {
        if (options.url === 'lightExtensionEntries:listSelectable') {
          return Promise.resolve({ data: { data: [{ ...entry, kind: 'js-block' }] } });
        }
        return successfulRequest(options);
      });
      const form = createRunJSForm({ sourceBinding: blockBinding });
      const originalValues = cloneValues(form.values);

      renderSourceBindingField(form, 'JSBlockLightExtensionSourceField');

      await waitFor(() => expect(screen.getByText('Required settings are complete')).toBeTruthy());
      expect(screen.queryByText('title')).toBeNull();
      expect(screen.queryByText('Inline code')).toBeNull();
      expect(screen.queryByText('Copy selected JS Template code')).toBeNull();
      expect(form.values).toEqual(originalValues);
    });

    it('copies current runtime code when switching back to inline', async () => {
      let copyPromise: Promise<unknown> | undefined;
      const confirmSpy = vi.spyOn(Modal, 'confirm').mockImplementation((config) => {
        copyPromise = Promise.resolve(config.onOk?.(() => undefined));
        return createModalInstance();
      });
      const form = createRunJSForm();

      renderSourceModeField(form);
      await selectCodeSource('Inline code');
      await copyPromise;

      expect(confirmSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          okText: 'Copy code',
          cancelText: 'Keep existing code',
        }),
      );
      expect(form.values).toMatchObject({
        sourceMode: 'inline',
        code: 'ctx.render("copied runtime");',
        version: 'v2',
        settings: { title: 'Revenue' },
        sourceRef: {
          type: 'vsc-file',
          repoId: 'old_inline_repo',
          commitId: 'old_inline_commit',
          entry: 'src/client/index.tsx',
        },
        sourceBinding,
      });
      expect(
        mocks.request.mock.calls.filter(([options]) => options.url === '/light-extension-runtime/resolve'),
      ).toHaveLength(1);
      expect(
        mocks.request.mock.calls.filter(
          ([options]) => options.url === `/light-extension-runtime/artifacts/${artifactHash}`,
        ),
      ).toHaveLength(1);
    });

    it('keeps the existing inline snapshot when the user declines copying', async () => {
      const confirmSpy = vi.spyOn(Modal, 'confirm').mockImplementation((config) => {
        config.onCancel?.(() => undefined);
        return createModalInstance();
      });
      const form = createRunJSForm();
      const originalSnapshot = cloneValues(form.values);

      renderSourceModeField(form);
      await selectCodeSource('Inline code');

      expect(confirmSpy).toHaveBeenCalled();
      expect(form.values).toEqual({ ...originalSnapshot, sourceMode: 'inline' });
      expect(mocks.request).toHaveBeenCalledWith(
        expect.objectContaining({ url: 'lightExtensionEntries:listSelectable' }),
      );
      expect(
        mocks.request.mock.calls.every(([options]) => options.url === 'lightExtensionEntries:listSelectable'),
      ).toBe(true);
    });

    it('keeps the external binding and fallback snapshot when copying current code fails', async () => {
      const copyError = new Error('resolve failed');
      mocks.request.mockImplementation((options: { url: string }) => {
        if (options.url === '/light-extension-runtime/resolve') {
          return Promise.reject(copyError);
        }
        return successfulRequest(options);
      });
      let copyPromise: Promise<unknown> | undefined;
      vi.spyOn(Modal, 'confirm').mockImplementation((config) => {
        copyPromise = Promise.resolve(config.onOk?.(() => undefined));
        copyPromise.catch(() => undefined);
        return createModalInstance();
      });
      const form = createRunJSForm();
      const originalValues = cloneValues(form.values);

      renderSourceModeField(form);
      await selectCodeSource('Inline code');

      await expect(copyPromise).rejects.toBe(copyError);
      expect(form.values).toEqual(originalValues);
      expect(
        mocks.request.mock.calls.filter(([options]) => options.url === '/light-extension-runtime/resolve'),
      ).toHaveLength(1);
      expect(
        mocks.request.mock.calls.filter(
          ([options]) => options.url === `/light-extension-runtime/artifacts/${artifactHash}`,
        ),
      ).toHaveLength(0);
    });

    it('keeps the external binding and fallback snapshot when fetching the artifact fails', async () => {
      const copyError = new Error('artifact request failed');
      mocks.request.mockImplementation((options: { url: string }) => {
        if (options.url === `/light-extension-runtime/artifacts/${artifactHash}`) {
          return Promise.reject(copyError);
        }
        return successfulRequest(options);
      });
      let copyPromise: Promise<unknown> | undefined;
      vi.spyOn(Modal, 'confirm').mockImplementation((config) => {
        copyPromise = Promise.resolve(config.onOk?.(() => undefined));
        copyPromise.catch(() => undefined);
        return createModalInstance();
      });
      const form = createRunJSForm();
      const originalValues = cloneValues(form.values);

      renderSourceModeField(form);
      await selectCodeSource('Inline code');

      await expect(copyPromise).rejects.toBe(copyError);
      expect(form.values).toEqual(originalValues);
      expect(
        mocks.request.mock.calls.filter(([options]) => options.url === '/light-extension-runtime/resolve'),
      ).toHaveLength(1);
      expect(
        mocks.request.mock.calls.filter(
          ([options]) => options.url === `/light-extension-runtime/artifacts/${artifactHash}`,
        ),
      ).toHaveLength(1);
    });
  });

  function createRunJSForm(overrides: Partial<RunJSFormValues> = {}) {
    return createForm<RunJSFormValues>({
      initialValues: {
        sourceMode: 'light-extension',
        code: 'ctx.render("old inline");',
        version: 'v1',
        settings: { title: 'Revenue' },
        sourceRef: {
          type: 'vsc-file',
          repoId: 'old_inline_repo',
          commitId: 'old_inline_commit',
          entry: 'src/client/index.tsx',
        },
        sourceBinding: { ...sourceBinding },
        ...overrides,
      },
    });
  }

  function renderSourceModeField(
    form: ReturnType<typeof createRunJSForm>,
    component: SourceFieldComponent = 'JSPageLightExtensionSourceField',
  ) {
    return renderWithEngine(
      form,
      <SchemaField
        schema={{
          type: 'object',
          properties: {
            sourceMode: {
              type: 'string',
              'x-component': component,
            },
          },
        }}
      />,
    );
  }

  function renderSourceBindingField(
    form: ReturnType<typeof createRunJSForm>,
    component: SourceFieldComponent = 'JSPageLightExtensionSourceField',
  ) {
    return renderWithEngine(
      form,
      <SchemaField
        schema={{
          type: 'object',
          properties: {
            sourceMode: {
              type: 'string',
              'x-display': 'hidden',
            },
            sourceBinding: {
              type: 'object',
              'x-component': component,
            },
          },
        }}
      />,
    );
  }

  function renderWithEngine(form: ReturnType<typeof createRunJSForm>, children: React.ReactNode) {
    const engine = new FlowEngine();
    engine.context.defineProperty('api', {
      value: {
        request: mocks.request,
      },
    });

    return render(
      <FlowEngineProvider engine={engine}>
        <FormProvider form={form}>{children}</FormProvider>
      </FlowEngineProvider>,
    );
  }

  async function selectCodeSource(option: string) {
    await waitFor(() =>
      expect(mocks.request).toHaveBeenCalledWith(
        expect.objectContaining({ url: 'lightExtensionEntries:listSelectable' }),
      ),
    );
    await act(async () => {
      fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Code source' }));
      fireEvent.change(screen.getByRole('combobox', { name: 'Code source' }), { target: { value: option } });
      fireEvent.click(await screen.findByText(option));
    });
  }

  function successfulRequest(options: { url: string }) {
    if (options.url === '/light-extension-runtime/resolve') {
      return Promise.resolve({
        data: {
          data: {
            entryId: 'entry_sales',
            entryPath: 'src/client/js-pages/sales/index.tsx',
            artifactHash,
            artifactUrl: `/api/light-extension-runtime/artifacts/${artifactHash}`,
            runtimeCodeHash: 'runtime_hash',
            version: 'v2',
            settings: {},
            settingsHash: 'settings_hash',
          },
        },
      });
    }
    if (options.url === `/light-extension-runtime/artifacts/${artifactHash}`) {
      return Promise.resolve({
        data: {
          artifactHash,
          runtimeCodeHash: 'runtime_hash',
          code: 'ctx.render("copied runtime");',
          sourceMap: null,
          version: 'v2',
          entryPath: 'src/client/js-pages/sales/index.tsx',
          runtimeContract: 'light-extension.runtime-artifact.v1',
          byteSize: 64,
        },
      });
    }
    if (options.url === 'lightExtensionEntries:listSelectable') {
      return Promise.resolve({ data: { data: [entry] } });
    }
    return Promise.reject(new Error(`Unexpected request: ${options.url}`));
  }

  function createModalInstance(): ReturnType<typeof Modal.confirm> {
    return {
      destroy: vi.fn(),
      update: vi.fn(),
    } as ReturnType<typeof Modal.confirm>;
  }

  function cloneValues(values: RunJSFormValues): RunJSFormValues {
    return JSON.parse(JSON.stringify(values));
  }
}
registerSourceModeRoundTripTests();
