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
import { act, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { FlowEngine, FlowEngineProvider } from '@nocobase/flow-engine';

import {
  getNextLightExtensionSourceBindingVersionPolicy,
  JSFieldLightExtensionSourceField,
} from '../components/JSBlockLightExtensionSourceField';
import {
  getNextSelectorBindingVersionPolicy,
  RepoEntryPublicationSelector,
} from '../components/RepoEntryPublicationSelector';

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
    JSFieldLightExtensionSourceField,
  },
});

const salesPublication = {
  id: 'pub_sales',
  repoId: 'repo_sales',
  entryId: 'entry_sales',
  commitId: 'commit_sales',
  entryPath: 'src/client/js-blocks/sales/index.tsx',
  target: 'client',
  kind: 'js-block',
  surfaceStyle: 'render',
  runtimeVersion: 'v2',
  artifact: {
    version: 'v2',
    entryPath: 'src/client/js-blocks/sales/index.tsx',
  },
  settingsSchemaSnapshot: null,
  settingsDefaultsSnapshot: {},
  settingsSchemaHash: 'schema_hash',
  settingsDefaultsHash: 'defaults_hash',
  filesHash: 'files_hash',
  runtimeCodeHash: 'runtime_hash',
  diagnostics: [],
};

const supportPublication = {
  ...salesPublication,
  id: 'pub_support',
  entryId: 'entry_support',
  commitId: 'commit_support',
  entryPath: 'src/client/js-blocks/support/index.tsx',
};

const phonePublication = {
  ...salesPublication,
  id: 'pub_phone',
  entryId: 'entry_phone',
  commitId: 'commit_phone',
  entryPath: 'src/client/js-fields/phone-link/index.tsx',
  kind: 'js-field',
  surfaceStyle: 'value',
};

const actionPublication = {
  ...salesPublication,
  id: 'pub_action',
  entryId: 'entry_action',
  commitId: 'commit_action',
  entryPath: 'src/client/js-actions/show-message/index.ts',
  kind: 'js-action',
  surfaceStyle: 'action',
};

const entries = [
  {
    id: 'entry_sales',
    repoId: 'repo_sales',
    target: 'client',
    kind: 'js-block',
    entryName: 'sales',
    entryPath: 'src/client/js-blocks/sales/index.tsx',
    metaPath: null,
    settingsPath: null,
    title: 'Sales Entry',
    description: null,
    category: null,
    icon: null,
    tags: null,
    sort: null,
    activePublicationId: 'pub_sales',
    activePublication: salesPublication,
    healthStatus: 'ready',
    diagnostics: [],
  },
  {
    id: 'entry_support',
    repoId: 'repo_sales',
    target: 'client',
    kind: 'js-block',
    entryName: 'support',
    entryPath: 'src/client/js-blocks/support/index.tsx',
    metaPath: null,
    settingsPath: null,
    title: 'Support Entry',
    description: null,
    category: null,
    icon: null,
    tags: null,
    sort: null,
    activePublicationId: 'pub_support',
    activePublication: supportPublication,
    healthStatus: 'ready',
    diagnostics: [],
  },
  {
    id: 'entry_phone',
    repoId: 'repo_sales',
    target: 'client',
    kind: 'js-field',
    entryName: 'phone-link',
    entryPath: 'src/client/js-fields/phone-link/index.tsx',
    metaPath: null,
    settingsPath: null,
    title: 'Phone Field',
    description: null,
    category: null,
    icon: null,
    tags: null,
    sort: null,
    activePublicationId: 'pub_phone',
    activePublication: phonePublication,
    healthStatus: 'ready',
    diagnostics: [],
  },
  {
    id: 'entry_action',
    repoId: 'repo_sales',
    target: 'client',
    kind: 'js-action',
    entryName: 'show-message',
    entryPath: 'src/client/js-actions/show-message/index.ts',
    metaPath: null,
    settingsPath: null,
    title: 'Show Message',
    description: null,
    category: null,
    icon: null,
    tags: null,
    sort: null,
    activePublicationId: 'pub_action',
    activePublication: actionPublication,
    healthStatus: 'ready',
    diagnostics: [],
  },
];

function renderSelector(props: React.ComponentProps<typeof RepoEntryPublicationSelector>) {
  const engine = new FlowEngine();
  engine.context.defineProperty('api', {
    value: {
      request: mocks.request,
    },
  });

  const result = render(
    <FlowEngineProvider engine={engine}>
      <RepoEntryPublicationSelector {...props} />
    </FlowEngineProvider>,
  );

  return {
    ...result,
    rerenderSelector(nextProps: React.ComponentProps<typeof RepoEntryPublicationSelector>) {
      result.rerender(
        <FlowEngineProvider engine={engine}>
          <RepoEntryPublicationSelector {...nextProps} />
        </FlowEngineProvider>,
      );
    },
  };
}

function renderStatefulSelector({
  initialValue,
  onChange,
  onClear,
}: {
  initialValue?: React.ComponentProps<typeof RepoEntryPublicationSelector>['value'];
  onChange?: React.ComponentProps<typeof RepoEntryPublicationSelector>['onChange'];
  onClear?: React.ComponentProps<typeof RepoEntryPublicationSelector>['onClear'];
}) {
  const engine = new FlowEngine();
  engine.context.defineProperty('api', {
    value: {
      request: mocks.request,
    },
  });

  const StatefulSelector = () => {
    const [binding, setBinding] =
      React.useState<React.ComponentProps<typeof RepoEntryPublicationSelector>['value']>(initialValue);
    return (
      <RepoEntryPublicationSelector
        value={binding}
        onChange={(nextBinding, publication, defaults) => {
          setBinding(nextBinding);
          onChange?.(nextBinding, publication, defaults);
        }}
        onClear={() => {
          setBinding(undefined);
          onClear?.();
        }}
      />
    );
  };

  return render(
    <FlowEngineProvider engine={engine}>
      <StatefulSelector />
    </FlowEngineProvider>,
  );
}

async function flushAsyncEffects() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

function mockSelectorRequests({
  selectableEntries = entries,
  publicationsByEntry = {
    entry_sales: [salesPublication],
    entry_support: [supportPublication],
    entry_phone: [phonePublication],
    entry_action: [actionPublication],
  },
  activePublicationIdByEntry = {},
}: {
  selectableEntries?: typeof entries;
  publicationsByEntry?: Record<string, Array<typeof salesPublication>>;
  activePublicationIdByEntry?: Record<string, string | null>;
} = {}) {
  mocks.request.mockImplementation((options: { url: string }) => {
    if (options.url === 'lightExtensionEntries:listSelectable') {
      return Promise.resolve({
        data: {
          data: selectableEntries,
        },
      });
    }

    const publicationsUrlPrefix = '/light-extension-entries/';
    const publicationsUrlSuffix = '/publications';
    if (options.url.startsWith(publicationsUrlPrefix) && options.url.endsWith(publicationsUrlSuffix)) {
      const entryId = decodeURIComponent(
        options.url.slice(publicationsUrlPrefix.length, -publicationsUrlSuffix.length),
      );
      const entry = selectableEntries.find((item) => item.id === entryId);
      const activePublicationId = Object.prototype.hasOwnProperty.call(activePublicationIdByEntry, entryId)
        ? activePublicationIdByEntry[entryId]
        : entry?.activePublicationId || null;
      return Promise.resolve({
        data: {
          data: {
            entryId,
            activePublicationId,
            publications: publicationsByEntry[entryId] || [],
          },
        },
      });
    }

    return Promise.reject(new Error(`Unexpected request: ${options.url}`));
  });
}

describe('RepoEntryPublicationSelector state consistency', () => {
  it('syncs selection when the controlled binding changes after mount', async () => {
    const onChange = vi.fn();
    mockSelectorRequests();

    const result = renderSelector({
      value: {
        type: 'light-extension-entry',
        repoId: 'repo_sales',
        entryId: 'entry_sales',
        kind: 'js-block',
        publicationId: 'pub_sales',
        versionPolicy: 'pinned',
      },
      onChange,
    });

    await flushAsyncEffects();
    expect(mocks.request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'lightExtensionEntries:listSelectable',
        method: 'post',
        data: { kind: 'js-block' },
      }),
    );
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        entryId: 'entry_sales',
        publicationId: 'pub_sales',
      }),
      salesPublication,
      {},
    );
    onChange.mockClear();

    result.rerenderSelector({
      value: {
        type: 'light-extension-entry',
        repoId: 'repo_sales',
        entryId: 'entry_support',
        kind: 'js-block',
        publicationId: 'pub_support',
        versionPolicy: 'pinned',
      },
      onChange,
    });

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          entryId: 'entry_support',
          publicationId: 'pub_support',
        }),
        supportPublication,
        {},
      );
    });
  });

  it('preserves a controlled pinned publication when a newer publication is active', async () => {
    const onChange = vi.fn();
    const onClear = vi.fn();
    const salesPublicationV2 = {
      ...salesPublication,
      id: 'pub_sales_v2',
      commitId: 'commit_sales_v2',
      settingsSchemaHash: 'schema_hash_v2',
    };
    mockSelectorRequests({
      selectableEntries: entries.map((entry) =>
        entry.id === 'entry_sales'
          ? {
              ...entry,
              activePublicationId: 'pub_sales_v2',
              activePublication: salesPublicationV2,
            }
          : entry,
      ),
      publicationsByEntry: {
        entry_sales: [salesPublication, salesPublicationV2],
        entry_support: [supportPublication],
        entry_phone: [phonePublication],
        entry_action: [actionPublication],
      },
    });

    renderSelector({
      value: {
        type: 'light-extension-entry',
        repoId: 'repo_sales',
        entryId: 'entry_sales',
        kind: 'js-block',
        publicationId: 'pub_sales',
        versionPolicy: 'pinned',
      },
      onChange,
      onClear,
    });

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          entryId: 'entry_sales',
          publicationId: 'pub_sales',
          versionPolicy: 'pinned',
        }),
        salesPublication,
        {},
      );
    });
    expect(onClear).not.toHaveBeenCalled();
  });

  it('treats legacy controlled bindings without a version policy as pinned', async () => {
    const onChange = vi.fn();
    mockSelectorRequests();

    renderSelector({
      value: {
        type: 'light-extension-entry',
        repoId: 'repo_sales',
        entryId: 'entry_sales',
        kind: 'js-block',
        publicationId: 'pub_sales',
      },
      onChange,
    });

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          entryId: 'entry_sales',
          publicationId: 'pub_sales',
          versionPolicy: 'pinned',
        }),
        salesPublication,
        {},
      );
    });
  });

  it('heals a controlled binding when only the repo and entry selection are reusable', async () => {
    const onChange = vi.fn();
    const onClear = vi.fn();
    mockSelectorRequests();

    renderSelector({
      value: {
        type: 'light-extension-entry',
        repoId: 'repo_sales',
        entryId: 'entry_sales',
        kind: 'js-block',
        publicationId: 'pub_sales',
        versionPolicy: 'active',
      } as unknown as React.ComponentProps<typeof RepoEntryPublicationSelector>['value'],
      onChange,
      onClear,
    });

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          entryId: 'entry_sales',
          publicationId: 'pub_sales',
          versionPolicy: 'follow-active',
        }),
        salesPublication,
        {},
      );
    });
    expect(onClear).not.toHaveBeenCalled();
  });

  it('does not revive a binding after the controlled value is cleared', async () => {
    const onChange = vi.fn();
    mockSelectorRequests();

    const result = renderSelector({
      value: {
        type: 'light-extension-entry',
        repoId: 'repo_sales',
        entryId: 'entry_sales',
        kind: 'js-block',
        publicationId: 'pub_sales',
        versionPolicy: 'pinned',
      },
      onChange,
    });

    await flushAsyncEffects();
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        entryId: 'entry_sales',
        publicationId: 'pub_sales',
      }),
      salesPublication,
      {},
    );
    onChange.mockClear();

    result.rerenderSelector({
      value: undefined,
      onChange,
    });

    await waitFor(() => {
      expect(screen.queryByText('Sales Entry')).toBeNull();
      expect(screen.queryByText('pub_sales')).toBeNull();
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('keeps the accepted active publication binding without clearing it', async () => {
    const onChange = vi.fn();
    const onClear = vi.fn();
    mockSelectorRequests();

    renderStatefulSelector({
      initialValue: {
        type: 'light-extension-entry',
        repoId: 'repo_sales',
        entryId: 'entry_sales',
        kind: 'js-block',
        publicationId: 'pub_sales',
        versionPolicy: 'pinned',
      },
      onChange,
      onClear,
    });

    await flushAsyncEffects();
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        entryId: 'entry_sales',
        publicationId: 'pub_sales',
      }),
      salesPublication,
      {},
    );
    onChange.mockClear();
    onClear.mockClear();

    expect(onClear).not.toHaveBeenCalled();
  });

  it('loads and exposes publication choices when the selected entry changes', async () => {
    const onChange = vi.fn();
    const onClear = vi.fn();
    mockSelectorRequests();

    const result = renderSelector({
      onChange,
      onClear,
    });

    await flushAsyncEffects();
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        entryId: 'entry_sales',
        publicationId: 'pub_sales',
      }),
      salesPublication,
      {},
    );
    onChange.mockClear();

    result.rerenderSelector({
      value: {
        type: 'light-extension-entry',
        repoId: 'repo_sales',
        entryId: 'entry_support',
        kind: 'js-block',
        publicationId: 'pub_support',
        versionPolicy: 'pinned',
      },
      onChange,
      onClear,
    });

    expect(onChange).not.toHaveBeenCalledWith(
      expect.objectContaining({
        entryId: 'entry_support',
        publicationId: 'pub_sales',
      }),
      expect.anything(),
      expect.anything(),
    );
    await flushAsyncEffects();
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        entryId: 'entry_support',
        publicationId: 'pub_support',
        versionPolicy: 'pinned',
      }),
      supportPublication,
      {},
    );
    expect(onClear).not.toHaveBeenCalled();
    expect(mocks.request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/light-extension-entries/entry_support/publications',
        method: 'get',
      }),
    );
    expect(screen.getAllByLabelText('Publication').length).toBeGreaterThan(0);
  });

  it('scopes selectable entries to the requested kind and clears mismatched bindings', async () => {
    const onChange = vi.fn();
    const onClear = vi.fn();
    mockSelectorRequests();

    renderSelector({
      kind: 'js-field',
      value: {
        type: 'light-extension-entry',
        repoId: 'repo_sales',
        entryId: 'entry_action',
        kind: 'js-action',
        publicationId: 'pub_action',
        versionPolicy: 'pinned',
      },
      onChange,
      onClear,
    });

    await waitFor(() => expect(onClear).toHaveBeenCalled());
    expect(mocks.request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'lightExtensionEntries:listSelectable',
        method: 'post',
        data: { kind: 'js-field' },
      }),
    );
    expect(onChange).not.toHaveBeenCalledWith(expect.objectContaining({ kind: 'js-action' }), expect.anything(), {});
  });

  it('pins JS Field source bindings by default when selected through the field source component', async () => {
    mockSelectorRequests();
    const engine = new FlowEngine();
    engine.context.defineProperty('api', {
      value: {
        request: mocks.request,
      },
    });
    const form = createForm({
      initialValues: {
        sourceMode: 'light-extension',
        settings: {},
      },
    });

    render(
      <FlowEngineProvider engine={engine}>
        <FormProvider form={form}>
          <SchemaField
            schema={{
              type: 'object',
              properties: {
                sourceBinding: {
                  type: 'object',
                  'x-component': 'JSFieldLightExtensionSourceField',
                },
              },
            }}
          />
        </FormProvider>
      </FlowEngineProvider>,
    );

    await waitFor(() => {
      expect(form.values.sourceBinding).toMatchObject({
        kind: 'js-field',
        entryId: 'entry_phone',
        publicationId: 'pub_phone',
        versionPolicy: 'pinned',
      });
    });
    expect(mocks.request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'lightExtensionEntries:listSelectable',
        method: 'post',
        data: { kind: 'js-field' },
      }),
    );
  });

  it('pins the selected publication when manually switching from follow-active', () => {
    const currentBinding = {
      type: 'light-extension-entry',
      repoId: 'repo_sales',
      entryId: 'entry_phone',
      kind: 'js-field',
      publicationId: 'pub_phone_v2',
      versionPolicy: 'follow-active',
    } as const;
    const manuallySelectedBinding = {
      ...currentBinding,
      publicationId: 'pub_phone',
      versionPolicy: 'pinned',
    } as const;

    expect(
      getNextSelectorBindingVersionPolicy({
        controlledValue: currentBinding,
        selectedEntryId: 'entry_phone',
        selectedPublicationId: 'pub_phone',
        manuallySelectedPublicationId: 'pub_phone',
      }),
    ).toBe('pinned');
    expect(
      getNextLightExtensionSourceBindingVersionPolicy({
        sourceBinding: currentBinding,
        binding: manuallySelectedBinding,
        defaultVersionPolicy: 'pinned',
      }),
    ).toBe('pinned');
    expect(
      getNextLightExtensionSourceBindingVersionPolicy({
        sourceBinding: {
          ...currentBinding,
          publicationId: 'pub_phone_legacy',
        },
        binding: {
          ...currentBinding,
          publicationId: 'pub_phone_v2',
          versionPolicy: 'follow-active',
        },
        defaultVersionPolicy: 'pinned',
      }),
    ).toBe('follow-active');
  });
});
