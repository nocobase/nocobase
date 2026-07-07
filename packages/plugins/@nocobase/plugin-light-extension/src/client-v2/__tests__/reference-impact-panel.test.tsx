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
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { FlowEngine, FlowEngineProvider } from '@nocobase/flow-engine';

import { ReferenceImpactPanel } from '../components/ReferenceImpactPanel';
import EntryReferencesPanel from '../pages/EntryReferencesPanel';

type RequestOptions = {
  url: string;
  data?: {
    repoId?: string;
    toPublicationId?: string;
  };
};

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
  t: (key: string) => key,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mocks.t,
  }),
}));

describe('ReferenceImpactPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows reference locations, publication impact, and settings validation result', async () => {
    renderWithEngine(<ReferenceImpactPanel impact={createImpact()} />);

    expect(screen.getByText('flow_ready')).toBeTruthy();
    expect(screen.getByText('flow_invalid')).toBeTruthy();
    expect(screen.getByText('Compatible')).toBeTruthy();
    expect(screen.getByText('Incompatible')).toBeTruthy();
    expect(screen.getByText('$.threshold: settings_maximum')).toBeTruthy();
    expect(screen.getByText('settings_invalid')).toBeTruthy();
    expect(screen.getAllByText('Ready')).toHaveLength(1);
  });

  it('bulk-upgrades selected compatible references with expected publication and settings hashes', async () => {
    mocks.request.mockImplementation((options: RequestOptions) => {
      if (options.url === 'lightExtensionReferences:bulkUpgrade') {
        return Promise.resolve({
          data: {
            data: {
              toPublication: createPublication('lep_v2'),
              items: [{ referenceId: 'lef_ready', status: 'upgraded' }],
              summary: {
                upgraded: 1,
                conflict: 0,
                incompatible: 0,
                skipped: 0,
                missing: 0,
              },
            },
          },
        });
      }
      if (options.url === 'lightExtensionReferences:impact') {
        return Promise.resolve({
          data: {
            data: createImpact(),
          },
        });
      }
      return Promise.reject(new Error(`Unexpected request: ${options.url}`));
    });

    renderWithEngine(<ReferenceImpactPanel impact={createImpact()} />);

    fireEvent.click(screen.getAllByRole('checkbox')[1]);
    fireEvent.click(screen.getByRole('button', { name: /Bulk upgrade/ }));

    await waitFor(() =>
      expect(mocks.request).toHaveBeenCalledWith({
        url: 'lightExtensionReferences:bulkUpgrade',
        method: 'post',
        data: {
          toPublicationId: 'lep_v2',
          referenceIds: ['lef_ready'],
          expectedPublicationIdByReference: {
            lef_ready: 'lep_v1',
          },
          expectedSettingsHashByReference: {
            lef_ready: 'settings_hash_ready',
          },
        },
      }),
    );
    expect(await screen.findByText('Bulk upgrade completed')).toBeTruthy();
  });

  it('renders the references page empty state when no repository is selected', () => {
    renderWithEngine(
      <MemoryRouter initialEntries={['/admin/settings/light-extension?panel=references']}>
        <EntryReferencesPanel />
      </MemoryRouter>,
    );

    expect(screen.getByText('References')).toBeTruthy();
    expect(screen.getByText('Select a repository from the light extension list')).toBeTruthy();
  });

  it('defaults the target publication to the selected entry when entryId is present', async () => {
    mocks.request.mockImplementation((options: RequestOptions) => {
      if (options.url === '/light-extension-entries/lee_sales/publications') {
        return Promise.resolve({
          data: {
            data: {
              entryId: 'lee_sales',
              activePublicationId: 'lep_sales',
              publications: [createPublication('lep_sales', 'lee_sales')],
            },
          },
        });
      }
      if (options.url === 'lightExtensionReferences:impact') {
        return Promise.resolve({
          data: {
            data: {
              ...createImpact('lep_sales'),
              references: [],
            },
          },
        });
      }
      return Promise.reject(new Error(`Unexpected request: ${options.url}`));
    });

    renderWithEngine(
      <MemoryRouter
        initialEntries={['/admin/settings/light-extension?panel=references&repoId=ler_sales&entryId=lee_sales']}
      >
        <EntryReferencesPanel />
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(mocks.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'lightExtensionReferences:impact',
          data: expect.objectContaining({
            entryId: 'lee_sales',
            toPublicationId: 'lep_sales',
          }),
        }),
      ),
    );
  });

  it('loads repo-scoped target publications through usePublication selector APIs', async () => {
    mocks.request.mockImplementation((options: RequestOptions) => {
      if (options.url === 'lightExtensionEntries:listSelectable') {
        return Promise.resolve({
          data: {
            data: [createSelectableEntry('lee_sales', 'lep_sales'), createSelectableEntry('lee_margin', 'lep_margin')],
          },
        });
      }
      if (options.url === '/light-extension-entries/lee_sales/publications') {
        return Promise.resolve({
          data: {
            data: {
              entryId: 'lee_sales',
              activePublicationId: 'lep_sales',
              publications: [createPublication('lep_sales', 'lee_sales')],
            },
          },
        });
      }
      if (options.url === '/light-extension-entries/lee_margin/publications') {
        return Promise.resolve({
          data: {
            data: {
              entryId: 'lee_margin',
              activePublicationId: 'lep_margin',
              publications: [createPublication('lep_margin', 'lee_margin')],
            },
          },
        });
      }
      if (options.url === 'lightExtensionReferences:impact') {
        return Promise.resolve({
          data: {
            data: {
              ...createImpact('lep_sales'),
              references: [],
            },
          },
        });
      }
      return Promise.reject(new Error(`Unexpected request: ${options.url}`));
    });

    renderWithEngine(
      <MemoryRouter initialEntries={['/admin/settings/light-extension?panel=references&repoId=ler_sales']}>
        <EntryReferencesPanel />
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(mocks.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'lightExtensionEntries:listSelectable',
          data: {
            repoId: 'ler_sales',
          },
        }),
      ),
    );
    await waitFor(() =>
      expect(mocks.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/light-extension-entries/lee_sales/publications',
        }),
      ),
    );
    await waitFor(() =>
      expect(mocks.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'lightExtensionReferences:impact',
          data: expect.objectContaining({
            repoId: 'ler_sales',
            toPublicationId: 'lep_sales',
          }),
        }),
      ),
    );
  });

  it('reports blocked bulk-upgrade summaries without hiding refresh failures', async () => {
    let impactRequests = 0;
    mocks.request.mockImplementation((options: RequestOptions) => {
      if (options.url === 'lightExtensionReferences:impact') {
        impactRequests += 1;
        if (impactRequests === 1) {
          return Promise.resolve({
            data: {
              data: createImpact(),
            },
          });
        }
        return Promise.reject(new Error('refresh failed'));
      }
      if (options.url === 'lightExtensionReferences:bulkUpgrade') {
        return Promise.resolve({
          data: {
            data: {
              toPublication: createPublication('lep_v2'),
              items: [{ referenceId: 'lef_ready', status: 'skipped', reasonCode: 'owner_not_visible' }],
              summary: {
                upgraded: 0,
                conflict: 0,
                incompatible: 0,
                skipped: 1,
                missing: 0,
              },
            },
          },
        });
      }
      return Promise.reject(new Error(`Unexpected request: ${options.url}`));
    });

    renderWithEngine(<ReferenceImpactPanel input={{ repoId: 'ler_sales', toPublicationId: 'lep_v2' }} />);

    await screen.findByText('flow_ready');
    fireEvent.click(screen.getAllByRole('checkbox')[1]);
    fireEvent.click(screen.getByRole('button', { name: /Bulk upgrade/ }));

    expect(
      await screen.findByText('Bulk upgrade completed with blocked references. Reference impact refresh failed'),
    ).toBeTruthy();
  });

  it('ignores stale impact responses after the target publication changes', async () => {
    const staleImpact = createDeferred<unknown>();
    const currentImpact = createDeferred<unknown>();
    mocks.request.mockImplementation((options: RequestOptions) => {
      if (options.url === 'lightExtensionReferences:impact') {
        return options.data?.toPublicationId === 'pub_a' ? staleImpact.promise : currentImpact.promise;
      }
      if (options.url === 'lightExtensionReferences:bulkUpgrade') {
        return Promise.resolve({
          data: {
            data: {
              toPublication: createPublication('pub_b'),
              items: [{ referenceId: 'lef_ready', status: 'upgraded' }],
              summary: {
                upgraded: 1,
                conflict: 0,
                incompatible: 0,
                skipped: 0,
                missing: 0,
              },
            },
          },
        });
      }
      return Promise.reject(new Error(`Unexpected request: ${options.url}`));
    });

    const engine = new FlowEngine();
    engine.context.defineProperty('api', {
      value: {
        request: mocks.request,
      },
    });
    const { rerender } = render(
      <FlowEngineProvider engine={engine}>
        <ReferenceImpactPanel input={{ repoId: 'ler_sales', toPublicationId: 'pub_a' }} />
      </FlowEngineProvider>,
    );
    await waitFor(() =>
      expect(mocks.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'lightExtensionReferences:impact',
          data: expect.objectContaining({
            toPublicationId: 'pub_a',
          }),
        }),
      ),
    );

    rerender(
      <FlowEngineProvider engine={engine}>
        <ReferenceImpactPanel input={{ repoId: 'ler_sales', toPublicationId: 'pub_b' }} />
      </FlowEngineProvider>,
    );

    await act(async () => {
      currentImpact.resolve({
        data: {
          data: createImpact('pub_b'),
        },
      });
    });
    expect(await screen.findAllByText('pub_b')).toHaveLength(2);

    await act(async () => {
      staleImpact.resolve({
        data: {
          data: createImpact('pub_a'),
        },
      });
    });

    await waitFor(() => {
      expect(screen.queryByText('pub_a')).toBeNull();
      expect(screen.getAllByText('pub_b')).toHaveLength(2);
    });

    fireEvent.click(screen.getAllByRole('checkbox')[1]);
    fireEvent.click(screen.getByRole('button', { name: /Bulk upgrade/ }));
    await waitFor(() =>
      expect(mocks.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'lightExtensionReferences:bulkUpgrade',
          data: expect.objectContaining({
            toPublicationId: 'pub_b',
          }),
        }),
      ),
    );
  });
});

function renderWithEngine(children: React.ReactNode) {
  const engine = new FlowEngine();
  engine.context.defineProperty('api', {
    value: {
      request: mocks.request,
    },
  });
  return render(<FlowEngineProvider engine={engine}>{children}</FlowEngineProvider>);
}

function createImpact(targetPublicationId = 'lep_v2') {
  return {
    toPublication: createPublication(targetPublicationId),
    references: [
      {
        reference: createReference('lef_ready', 'flow_ready', 'settings_hash_ready'),
        targetPublicationId,
        settingsValidation: {
          compatible: true,
          settingsHash: 'settings_hash_ready',
          issues: [],
        },
      },
      {
        reference: createReference('lef_invalid', 'flow_invalid', 'settings_hash_invalid'),
        targetPublicationId,
        settingsValidation: {
          compatible: false,
          issues: [
            {
              path: '$.threshold',
              code: 'settings_maximum',
              message: 'Too large',
            },
          ],
        },
      },
    ],
    summary: {
      total: 2,
      upgradable: 1,
      incompatible: 1,
      skipped: 0,
    },
  };
}

function createDeferred<T>() {
  let resolveDeferred!: (value: T) => void;
  let rejectDeferred!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolve, reject) => {
    resolveDeferred = resolve;
    rejectDeferred = reject;
  });
  return {
    promise,
    resolve: resolveDeferred,
    reject: rejectDeferred,
  };
}

function createReference(id: string, modelUid: string, settingsHash: string) {
  return {
    id,
    repoId: 'ler_sales',
    entryId: 'lee_sales',
    publicationId: 'lep_v1',
    kind: 'js-block',
    ownerKind: 'flowModel.step',
    ownerLocator: {
      kind: 'flowModel.step',
      modelUid,
      use: 'JSBlockModel',
      stepPath: ['stepParams', 'jsSettings'],
    },
    ownerLocatorHash: `hash_${modelUid}`,
    versionPolicy: 'pinned',
    settingsHash,
    resolvedStatus: 'active',
  };
}

function createPublication(id: string, entryId = 'lee_sales') {
  return {
    id,
    repoId: 'ler_sales',
    entryId,
    commitId: 'vsc_commit_2',
    entryPath: 'src/client/js-blocks/sales/index.tsx',
    target: 'client',
    kind: 'js-block',
    surfaceStyle: 'render',
    runtimeVersion: 'v2',
    artifact: {
      version: 'v2',
      entryPath: 'src/client/js-blocks/sales/index.tsx',
      filesHash: 'files_hash',
      metadata: {},
      diagnostics: [],
    },
    settingsSchemaSnapshot: null,
    settingsDefaultsSnapshot: {},
    settingsSchemaHash: 'schema_hash',
    settingsDefaultsHash: 'defaults_hash',
    filesHash: 'files_hash',
    runtimeCodeHash: 'runtime_hash',
    diagnostics: [],
    createdAt: '2026-07-06T00:00:00.000Z',
  };
}

function createSelectableEntry(id: string, activePublicationId: string) {
  return {
    id,
    repoId: 'ler_sales',
    target: 'client',
    kind: 'js-block',
    entryName: id,
    entryPath: `src/client/js-blocks/${id}/index.tsx`,
    metaPath: null,
    settingsPath: null,
    title: id,
    description: null,
    category: null,
    icon: null,
    tags: null,
    sort: null,
    activePublicationId,
    activePublication: createPublication(activePublicationId, id),
    healthStatus: 'ready',
    diagnostics: [],
  };
}
