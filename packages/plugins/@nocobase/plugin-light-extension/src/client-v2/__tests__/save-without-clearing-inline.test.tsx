/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createForm } from '@formily/core';
import { createSchemaField, FormProvider } from '@formily/react';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowEngine, FlowEngineProvider } from '@nocobase/flow-engine';

import { JSBlockLightExtensionSourceField } from '../components/JSBlockLightExtensionSourceField';

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
  t: vi.fn((key: string) => key),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mocks.t,
  }),
}));

const SchemaField = createSchemaField({
  components: {
    JSBlockLightExtensionSourceField,
  },
});

describe('JSBlockLightExtensionSourceField save behavior', () => {
  beforeEach(() => {
    mocks.request.mockReset();
    mocks.request.mockImplementation((options: { url: string }) => {
      if (options.url === 'lightExtensionEntries:listSelectable') {
        return Promise.resolve({
          data: {
            data: [createSelectableEntry()],
          },
        });
      }

      return Promise.reject(new Error(`Unexpected request: ${options.url}`));
    });
  });

  it('keeps existing inline code and version when editing a valid light-extension binding', async () => {
    const form = createForm({
      initialValues: {
        sourceMode: 'light-extension',
        sourceBinding: createSourceBinding(),
        settings: {},
        code: 'ctx.render("keep inline");',
        version: 'v2',
      },
    });

    renderSourceField(form);

    await waitFor(() => {
      expect(screen.getByText('title')).toBeTruthy();
      expect(form.values.sourceBinding).toMatchObject(createSourceBinding());
    });

    expect(form.values.code).toBe('ctx.render("keep inline");');
    expect(form.values.version).toBe('v2');
  });

  it('renders as a binding editor without source mode controls when bound to sourceBinding', async () => {
    const form = createForm({
      initialValues: {
        sourceMode: 'light-extension',
        sourceBinding: createSourceBinding(),
        settings: {},
        code: 'ctx.render("keep inline");',
        version: 'v2',
      },
    });

    renderSourceBindingField(form);

    await waitFor(() => {
      expect(screen.getByText('title')).toBeTruthy();
    });

    expect(screen.queryByText('Inline code')).toBeNull();
    expect(screen.queryByText('Copy selected light extension code')).toBeNull();
    expect(form.values.code).toBe('ctx.render("keep inline");');
    expect(form.values.version).toBe('v2');
  });
});

function renderSourceField(form: ReturnType<typeof createForm>) {
  return renderWithEngine(
    form,
    <SchemaField
      schema={{
        type: 'object',
        properties: {
          sourceMode: {
            type: 'string',
            'x-component': 'JSBlockLightExtensionSourceField',
          },
        },
      }}
    />,
  );
}

function renderSourceBindingField(form: ReturnType<typeof createForm>) {
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
            'x-component': 'JSBlockLightExtensionSourceField',
          },
        },
      }}
    />,
  );
}

function renderWithEngine(form: ReturnType<typeof createForm>, children: React.ReactNode) {
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

function createSourceBinding() {
  return {
    type: 'light-extension-entry',
    repoId: 'repo_sales',
    entryId: 'entry_sales',
    kind: 'js-block',
  };
}

function createSelectableEntry() {
  return {
    id: 'entry_sales',
    repoId: 'repo_sales',
    target: 'client',
    kind: 'js-block',
    entryName: 'sales',
    entryPath: 'src/client/js-blocks/sales/index.tsx',
    metaPath: null,
    settingsPath: null,
    title: 'Sales',
    description: null,
    category: null,
    icon: null,
    tags: null,
    sort: null,
    settingsSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          default: 'Sales',
        },
      },
    },
    compiledCommitId: 'commit_sales',
    runtimeArtifact: {
      code: 'ctx.render("sales");',
      version: 'v2',
      entryPath: 'src/client/js-blocks/sales/index.tsx',
    },
    runtimeVersion: 'v2',
    surfaceStyle: 'render',
    runtimeCodeHash: 'runtime_hash',
    filesHash: 'files_hash',
    settingsDefaultsHash: 'defaults_hash',
    compiledAt: '2026-07-09T00:00:00.000Z',
    healthStatus: 'ready',
    diagnostics: [],
  };
}
