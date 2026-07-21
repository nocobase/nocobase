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

import {
  JSBlockLightExtensionSourceField,
  JSPageLightExtensionSourceField,
} from '../components/JSBlockLightExtensionSourceField';

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
  t: vi.fn((key: string) => key),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mocks.t,
  }),
}));

vi.mock('../pages/LightExtensionWorkspacePage', () => {
  const MockLightExtensionWorkspacePage = ({
    repoId,
    initialPath,
    workspaceScope,
    onFooterActionsChange,
  }: {
    repoId?: string;
    initialPath?: string;
    workspaceScope?: unknown;
    onFooterActionsChange?: (actions: {
      dirty: boolean;
      disabled: boolean;
      loading: boolean;
      onCancel: () => void;
      onSave: () => void;
      requestSave: () => Promise<'unchanged'>;
    }) => void;
  }) => {
    React.useEffect(() => {
      onFooterActionsChange?.({
        dirty: false,
        disabled: true,
        loading: false,
        onCancel: () => undefined,
        onSave: () => undefined,
        requestSave: async () => 'unchanged',
      });
    }, [onFooterActionsChange]);

    return (
      <div
        data-initial-path={initialPath}
        data-repo-id={repoId}
        data-testid="entry-workspace"
        data-workspace-scope={JSON.stringify(workspaceScope)}
      />
    );
  };

  return { default: MockLightExtensionWorkspacePage };
});

const SchemaField = createSchemaField({
  components: {
    JSBlockLightExtensionSourceField,
    JSPageLightExtensionSourceField,
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
      expect(screen.getByText('Required settings are complete')).toBeTruthy();
      expect(screen.queryByText('title')).toBeNull();
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
      expect(screen.getByText('Required settings are complete')).toBeTruthy();
      expect(screen.queryByText('title')).toBeNull();
    });

    expect(screen.queryByText('Inline code')).toBeNull();
    expect(screen.queryByText('Copy selected light extension code')).toBeNull();
    expect(form.values.code).toBe('ctx.render("keep inline");');
    expect(form.values.version).toBe('v2');
  });

  it('keeps the complete JS Page inline snapshot while editing its external binding', async () => {
    mocks.request.mockResolvedValueOnce({
      data: {
        data: [createSelectableEntry('js-page')],
      },
    });
    const form = createForm({
      initialValues: {
        sourceMode: 'light-extension',
        sourceBinding: createSourceBinding('js-page'),
        settings: { title: 'Kept settings' },
        code: 'ctx.render(<div>Keep page</div>);',
        version: 'v2',
        sourceRef: 'inline-page-ref',
      },
    });

    renderSourceBindingField(form, {}, 'JSPageLightExtensionSourceField');

    await waitFor(() => expect(screen.getByText('Required settings are complete')).toBeTruthy());

    expect(form.values).toMatchObject({
      code: 'ctx.render(<div>Keep page</div>);',
      version: 'v2',
      sourceRef: 'inline-page-ref',
      settings: { title: 'Kept settings' },
    });
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

function renderSourceBindingField(
  form: ReturnType<typeof createForm>,
  componentProps: Record<string, unknown> = {},
  component = 'JSBlockLightExtensionSourceField',
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
            'x-component-props': componentProps,
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

function createSourceBinding(kind: 'js-block' | 'js-page' = 'js-block') {
  return {
    type: 'light-extension-entry',
    repoId: 'repo_sales',
    entryId: 'entry_sales',
    kind,
  };
}

function createSelectableEntry(kind: 'js-block' | 'js-page' = 'js-block') {
  const root = kind === 'js-page' ? 'js-pages' : 'js-blocks';
  return {
    id: 'entry_sales',
    repoId: 'repo_sales',
    target: 'client',
    kind,
    entryName: 'sales',
    entryPath: `src/client/${root}/sales/index.tsx`,
    descriptorPath: `src/client/${root}/sales/entry.json`,
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
    settingsSchemaHash: 'schema_hash',
    compiledCommitId: 'commit_sales',
    runtimeAvailable: true,
    runtimeVersion: 'v2',
    surfaceStyle: 'render',
    runtimeCodeHash: 'runtime_hash',
    filesHash: 'files_hash',
    settingsDefaultsHash: 'defaults_hash',
    compiledAt: '2026-07-09T00:00:00.000Z',
    healthStatus: 'ready',
  };
}
