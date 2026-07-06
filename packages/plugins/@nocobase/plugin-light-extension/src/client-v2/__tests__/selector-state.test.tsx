/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { FlowEngine, FlowEngineProvider } from '@nocobase/flow-engine';

import { RepoEntryPublicationSelector } from '../components/RepoEntryPublicationSelector';

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
  t: vi.fn((key: string) => key),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mocks.t,
  }),
}));

function createDeferred<T>() {
  let resolveDeferred!: (value: T) => void;
  let rejectDeferred!: (error: unknown) => void;
  const promise = new Promise<T>((resolve, reject) => {
    resolveDeferred = resolve;
    rejectDeferred = reject;
  });
  return { promise, resolve: resolveDeferred, reject: rejectDeferred };
}

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

describe('RepoEntryPublicationSelector state consistency', () => {
  it('syncs selection when the controlled binding changes after mount', async () => {
    const onChange = vi.fn();
    mocks.request.mockImplementation((options: { url: string }) => {
      if (options.url === 'lightExtensionEntries:listSelectable') {
        return Promise.resolve({
          data: {
            data: entries,
          },
        });
      }
      if (options.url === '/light-extension-entries/entry_sales/publications') {
        return Promise.resolve({
          data: {
            data: {
              entryId: 'entry_sales',
              activePublicationId: 'pub_sales',
              publications: [salesPublication],
            },
          },
        });
      }
      if (options.url === '/light-extension-entries/entry_support/publications') {
        return Promise.resolve({
          data: {
            data: {
              entryId: 'entry_support',
              activePublicationId: 'pub_support',
              publications: [supportPublication],
            },
          },
        });
      }
      return Promise.reject(new Error(`Unexpected request: ${options.url}`));
    });

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

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          entryId: 'entry_sales',
          publicationId: 'pub_sales',
        }),
        salesPublication,
        {},
      );
    });
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

  it('clears a controlled binding when its publication is no longer selectable', async () => {
    const onChange = vi.fn();
    const onClear = vi.fn();
    mocks.request.mockImplementation((options: { url: string }) => {
      if (options.url === 'lightExtensionEntries:listSelectable') {
        return Promise.resolve({
          data: {
            data: entries,
          },
        });
      }
      if (options.url === '/light-extension-entries/entry_sales/publications') {
        return Promise.resolve({
          data: {
            data: {
              entryId: 'entry_sales',
              activePublicationId: 'pub_sales',
              publications: [salesPublication],
            },
          },
        });
      }
      return Promise.reject(new Error(`Unexpected request: ${options.url}`));
    });

    renderSelector({
      value: {
        type: 'light-extension-entry',
        repoId: 'repo_sales',
        entryId: 'entry_sales',
        kind: 'js-block',
        publicationId: 'pub_missing',
        versionPolicy: 'pinned',
      },
      onChange,
      onClear,
    });

    await waitFor(() => {
      expect(onClear).toHaveBeenCalled();
    });
    expect(onChange).not.toHaveBeenCalledWith(
      expect.objectContaining({
        publicationId: 'pub_missing',
      }),
      expect.anything(),
      expect.anything(),
    );
    expect(onChange).not.toHaveBeenCalledWith(
      expect.objectContaining({
        entryId: 'entry_sales',
        publicationId: 'pub_sales',
      }),
      expect.anything(),
      expect.anything(),
    );
  });

  it('does not revive a binding after the controlled value is cleared', async () => {
    const onChange = vi.fn();
    mocks.request.mockImplementation((options: { url: string }) => {
      if (options.url === 'lightExtensionEntries:listSelectable') {
        return Promise.resolve({
          data: {
            data: entries,
          },
        });
      }
      if (options.url === '/light-extension-entries/entry_sales/publications') {
        return Promise.resolve({
          data: {
            data: {
              entryId: 'entry_sales',
              activePublicationId: 'pub_sales',
              publications: [salesPublication],
            },
          },
        });
      }
      return Promise.reject(new Error(`Unexpected request: ${options.url}`));
    });

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

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          entryId: 'entry_sales',
          publicationId: 'pub_sales',
        }),
        salesPublication,
        {},
      );
    });
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

  it('keeps the user-selected entry after clearing the previous controlled binding', async () => {
    const onChange = vi.fn();
    const onClear = vi.fn();
    mocks.request.mockImplementation((options: { url: string }) => {
      if (options.url === 'lightExtensionEntries:listSelectable') {
        return Promise.resolve({
          data: {
            data: entries,
          },
        });
      }
      if (options.url === '/light-extension-entries/entry_sales/publications') {
        return Promise.resolve({
          data: {
            data: {
              entryId: 'entry_sales',
              activePublicationId: 'pub_sales',
              publications: [salesPublication],
            },
          },
        });
      }
      if (options.url === '/light-extension-entries/entry_support/publications') {
        return Promise.resolve({
          data: {
            data: {
              entryId: 'entry_support',
              activePublicationId: 'pub_support',
              publications: [supportPublication],
            },
          },
        });
      }
      return Promise.reject(new Error(`Unexpected request: ${options.url}`));
    });

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

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          entryId: 'entry_sales',
          publicationId: 'pub_sales',
        }),
        salesPublication,
        {},
      );
    });
    onChange.mockClear();
    onClear.mockClear();

    fireEvent.mouseDown(screen.getByText('Sales Entry'));
    fireEvent.click(await screen.findByText('Support Entry'));

    await waitFor(() => {
      expect(onClear).toHaveBeenCalled();
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

  it('clears stale publication state and does not emit mixed bindings when switching entries fails to load', async () => {
    const supportPublicationsRequest = createDeferred<unknown>();
    const onChange = vi.fn();
    const onClear = vi.fn();
    mocks.request.mockImplementation((options: { url: string }) => {
      if (options.url === 'lightExtensionEntries:listSelectable') {
        return Promise.resolve({
          data: {
            data: entries,
          },
        });
      }
      if (options.url === '/light-extension-entries/entry_sales/publications') {
        return Promise.resolve({
          data: {
            data: {
              entryId: 'entry_sales',
              activePublicationId: 'pub_sales',
              publications: [salesPublication],
            },
          },
        });
      }
      if (options.url === '/light-extension-entries/entry_support/publications') {
        return supportPublicationsRequest.promise;
      }
      return Promise.reject(new Error(`Unexpected request: ${options.url}`));
    });

    renderSelector({
      onChange,
      onClear,
    });

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          entryId: 'entry_sales',
          publicationId: 'pub_sales',
        }),
        salesPublication,
        {},
      );
    });
    onChange.mockClear();

    fireEvent.mouseDown(screen.getByText('Sales Entry'));
    fireEvent.click(await screen.findByText('Support Entry'));

    await waitFor(() => {
      expect(onClear).toHaveBeenCalled();
    });
    expect(onChange).not.toHaveBeenCalledWith(
      expect.objectContaining({
        entryId: 'entry_support',
        publicationId: 'pub_sales',
      }),
      expect.anything(),
      expect.anything(),
    );

    await act(async () => {
      supportPublicationsRequest.reject(new Error('Failed to load support publications'));
      await supportPublicationsRequest.promise.catch(() => undefined);
    });

    await waitFor(() => {
      expect(screen.getByText('Failed to load support publications')).toBeTruthy();
    });
    expect(onChange).not.toHaveBeenCalled();
  });
});
