/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine, FlowEngineProvider } from '@nocobase/flow-engine';
import { createForm } from '@formily/core';
import { createSchemaField, FormProvider } from '@formily/react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Modal } from 'antd';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { LightExtensionRuntimeSourceBinding } from '../../shared/types';
import {
  JSBlockLightExtensionSourceField,
  JSPageLightExtensionSourceField,
} from '../components/JSBlockLightExtensionSourceField';

// Old case -> new owner:
// inline-preserve-code / does not clear inline fallback... -> preserves the inline fallback when first selecting an entry.
// save-without-clearing-inline / keeps existing JS Block inline code... -> mounts the JS Block binding editor without mutating the snapshot.
// save-without-clearing-inline / renders as a JS Block binding editor... -> mounts the JS Block binding editor without mutating the snapshot.
// save-without-clearing-inline / keeps the complete JS Page inline snapshot... -> renders the binding-only editor without mutating the snapshot.
// mode-switch-copyback / requires confirmation and copies current runtime code... -> copies current runtime code when switching inline.
// New owner: returning to the same external binding preserves the complete inline settings snapshot.
// New owners: resolve and artifact-copy failures each preserve the external binding and fallback snapshot.

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
  t: vi.fn((key: string) => key),
}));

const artifactHash = 'a'.repeat(64);

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mocks.t,
  }),
}));

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
    expect(mocks.request.mock.calls.every(([options]) => options.url === 'lightExtensionEntries:listSelectable')).toBe(
      true,
    );
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
    expect(screen.queryByText('Copy selected light extension code')).toBeNull();
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
    expect(screen.queryByText('Copy selected light extension code')).toBeNull();
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
    expect(mocks.request.mock.calls.every(([options]) => options.url === 'lightExtensionEntries:listSelectable')).toBe(
      true,
    );
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
