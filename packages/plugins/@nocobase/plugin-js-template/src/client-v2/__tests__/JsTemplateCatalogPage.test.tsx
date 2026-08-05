/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { createMockClient } from '@nocobase/client-v2';
import { FlowEngineProvider } from '@nocobase/flow-engine';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

import type { JsTemplateCatalogEntry, JsTemplateCreateJobSummary } from '../../shared/types';
import type { UseJsTemplateCreateJobsResult } from '../hooks/useJsTemplateCreateJobs';
import type { UseJsTemplateProjectResult } from '../hooks/useJsTemplateProject';
import JsTemplateCatalogPage from '../pages/JsTemplateCatalogPage';

const mocks = vi.hoisted(() => ({
  t: (key: string) => key,
  catalog: [] as JsTemplateCatalogEntry[],
  listCatalog: vi.fn(),
  listUsageLocations: vi.fn(),
  deleteTemplate: vi.fn(),
  createProject: vi.fn(),
  jobs: {
    initial: [] as JsTemplateCreateJobSummary[],
    update: vi.fn(),
    addAccepted: vi.fn(),
    dismiss: vi.fn(async () => undefined),
  },
}));

vi.mock('react-i18next', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-i18next')>();
  return {
    ...actual,
    useTranslation: () => ({ t: mocks.t }),
  };
});

vi.mock('../api/jsTemplatesRequests', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/jsTemplatesRequests')>();
  return {
    ...actual,
    listJsTemplateCatalog: (...args: unknown[]) => mocks.listCatalog(...args),
    listJsTemplateUsageLocations: (...args: unknown[]) => mocks.listUsageLocations(...args),
    deleteJsTemplate: (...args: unknown[]) => mocks.deleteTemplate(...args),
  };
});

vi.mock('../hooks/useJsTemplateProject', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useJsTemplateProject: () =>
      ({
        createProject: mocks.createProject,
      }) as unknown as UseJsTemplateProjectResult,
  };
});

vi.mock('../hooks/useJsTemplateCreateJobs', async () => {
  const ReactModule = await import('react');
  return {
    useJsTemplateCreateJobs: (): UseJsTemplateCreateJobsResult => {
      const [jobs, setJobs] = ReactModule.useState(mocks.jobs.initial);
      ReactModule.useEffect(() => {
        mocks.jobs.update.mockImplementation((nextJobs: JsTemplateCreateJobSummary[]) => setJobs(nextJobs));
      }, []);
      return {
        jobs,
        loading: false,
        error: null,
        addAcceptedJob: (job) => {
          mocks.jobs.addAccepted(job);
          setJobs((current) => [job, ...current.filter((candidate) => candidate.id !== job.id)]);
        },
        refresh: async () => undefined,
        dismiss: mocks.jobs.dismiss,
      };
    },
  };
});

describe('JsTemplateCatalogPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.catalog = [
      createCatalogEntry({
        id: 'jtt_first',
        kind: 'js-block',
        templateName: 'first-card',
        title: 'First card',
        usageCount: 1,
      }),
      createCatalogEntry({
        id: 'jtt_second',
        kind: 'js-action',
        templateName: 'second-action',
        title: 'Second action',
        usageCount: 2,
      }),
    ];
    mocks.listCatalog.mockImplementation(async () => mocks.catalog);
    mocks.listUsageLocations.mockResolvedValue({
      data: [],
      meta: { page: 1, pageSize: 10, count: 0, totalPage: 0, effectiveCount: 0, hiddenCount: 0 },
    });
    mocks.deleteTemplate.mockImplementation(async (_api: unknown, templateId: string) => {
      mocks.catalog = mocks.catalog.filter((entry) => entry.id !== templateId);
      return { project: { id: 'jtp_shared' }, templateId };
    });
    mocks.jobs.initial = [];
    mocks.createProject.mockResolvedValue(createJob());
  });

  it('renders one row per Template Entry and the required entry-centric columns', async () => {
    renderCatalog();

    expect(await screen.findByText('First card')).toBeInTheDocument();
    expect(screen.getByText('Second action')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Shared source' })).toHaveLength(2);
    for (const column of ['Template', 'Kind', 'Status', 'Usage count', 'Source Project']) {
      expect(screen.getByRole('columnheader', { name: column })).toBeInTheDocument();
    }
    expect(screen.getByRole('button', { name: 'View usage locations for First card' })).toHaveTextContent('1');
    expect(screen.getByRole('button', { name: 'View usage locations for Second action' })).toHaveTextContent('2');
  });

  it('renders disabled and archived as effective Template Entry statuses', async () => {
    mocks.catalog = [
      createCatalogEntry({ id: 'jtt_disabled', status: 'disabled', templateName: 'disabled', title: 'Disabled entry' }),
      createCatalogEntry({ id: 'jtt_archived', status: 'archived', templateName: 'archived', title: 'Archived entry' }),
    ];

    renderCatalog();

    expect(await screen.findByText('Disabled entry')).toBeInTheDocument();
    expect(
      within(screen.getByRole('row', { name: /Disabled entry/ })).getByRole('cell', { name: 'disabled' }),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole('row', { name: /Archived entry/ })).getByRole('cell', { name: 'archived' }),
    ).toBeInTheDocument();
  });

  it('creates a single Template Entry starter and reloads it into the catalog after the job succeeds', async () => {
    renderCatalog();
    await screen.findByText('First card');

    fireEvent.click(screen.getByRole('button', { name: 'Create JS Template' }));
    const dialog = await screen.findByRole('dialog', { name: 'Create JS Template' });
    fireEvent.change(within(dialog).getByLabelText('Template name'), { target: { value: 'new-card' } });
    fireEvent.change(within(dialog).getByLabelText('Template title'), { target: { value: 'New card' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(mocks.createProject).toHaveBeenCalledWith(
        expect.objectContaining({
          name: expect.stringMatching(/^jt_[a-z0-9]+$/),
          title: 'New card',
          message: 'Create JS Template entry',
          initialFiles: [
            expect.objectContaining({ path: 'src/client/js-blocks/new-card/index.tsx' }),
            expect.objectContaining({ path: 'src/client/js-blocks/new-card/entry.json' }),
          ],
        }),
      );
    });
    expect(mocks.jobs.addAccepted).toHaveBeenCalledWith(createJob());

    mocks.catalog = [
      ...mocks.catalog,
      createCatalogEntry({ id: 'jtt_new', templateName: 'new-card', title: 'New card' }),
    ];
    await act(async () => {
      mocks.jobs.update([]);
    });

    expect(await screen.findByText('New card')).toBeInTheDocument();
    expect(mocks.listCatalog).toHaveBeenCalledTimes(2);
  });

  it('opens a paginated, partially visible usage-locations view from the Template Entry row', async () => {
    mocks.listUsageLocations.mockResolvedValue({
      data: [
        {
          id: 'jtu_visible',
          projectId: 'jtp_shared',
          templateId: 'jtt_first',
          kind: 'js-block',
          ownerKind: 'flowModel.step',
          ownerLocator: { kind: 'flowModel.step', modelUid: 'fm_visible' },
          ownerLocatorHash: 'sha256:visible',
          settingsHash: 'sha256:settings',
          resolvedStatus: 'active',
          ownerTitle: 'Sales block',
          locationTitle: 'Sales dashboard',
          routeId: 'route_sales',
        },
      ],
      meta: { page: 1, pageSize: 10, count: 11, totalPage: 2, effectiveCount: 13, hiddenCount: 2 },
    });
    renderCatalog();
    await screen.findByText('First card');

    fireEvent.click(screen.getByRole('button', { name: 'View usage locations for First card' }));

    const dialog = await screen.findByRole('dialog', { name: 'Usage locations for First card' });
    expect(within(dialog).getByText('Sales dashboard')).toBeInTheDocument();
    expect(within(dialog).getByText('Sales block')).toBeInTheDocument();
    expect(within(dialog).getByText('2 usage locations are hidden by permissions.')).toBeInTheDocument();
    expect(within(dialog).getByText('active')).toBeInTheDocument();
    expect(mocks.listUsageLocations).toHaveBeenCalledWith(expect.anything(), {
      templateId: 'jtt_first',
      page: 1,
      pageSize: 10,
    });
    expect(within(dialog).getAllByRole('list').length).toBeGreaterThan(0);
  });

  it('ignores an obsolete usage response after the modal switches to another Template Entry', async () => {
    let resolveFirst: (value: ReturnType<typeof createUsageListResult>) => void = () => undefined;
    let resolveSecond: (value: ReturnType<typeof createUsageListResult>) => void = () => undefined;
    mocks.listUsageLocations.mockImplementation(
      async (_api: unknown, input: { templateId: string }) =>
        new Promise<ReturnType<typeof createUsageListResult>>((resolve) => {
          if (input.templateId === 'jtt_first') {
            resolveFirst = resolve;
          } else {
            resolveSecond = resolve;
          }
        }),
    );
    renderCatalog();
    await screen.findByText('First card');

    fireEvent.click(screen.getByRole('button', { name: 'View usage locations for First card' }));
    const firstDialog = await screen.findByRole('dialog', { name: 'Usage locations for First card' });
    fireEvent.click(within(firstDialog).getAllByRole('button', { name: 'Close' })[0]);
    fireEvent.click(screen.getByRole('button', { name: 'View usage locations for Second action' }));

    await act(async () => {
      resolveSecond(createUsageListResult('jtt_second', 'Second location'));
    });
    const dialog = await screen.findByRole('dialog', { name: 'Usage locations for Second action' });
    expect(within(dialog).getByRole('heading', { name: 'Second location' })).toBeInTheDocument();

    await act(async () => {
      resolveFirst(createUsageListResult('jtt_first', 'Obsolete first location'));
    });
    expect(within(dialog).queryByText('Obsolete first location')).not.toBeInTheDocument();
    expect(within(dialog).getByRole('heading', { name: 'Second location' })).toBeInTheDocument();
  });

  it('retries the failed usage page without returning to the first page', async () => {
    mocks.listUsageLocations
      .mockReset()
      .mockResolvedValueOnce({
        data: [],
        meta: { page: 1, pageSize: 10, count: 11, totalPage: 2, effectiveCount: 11, hiddenCount: 0 },
      })
      .mockRejectedValueOnce(new Error('Failed to load page 2'))
      .mockResolvedValueOnce({
        data: [],
        meta: { page: 2, pageSize: 10, count: 11, totalPage: 2, effectiveCount: 11, hiddenCount: 0 },
      });
    renderCatalog();
    await screen.findByText('First card');

    fireEvent.click(screen.getByRole('button', { name: 'View usage locations for First card' }));
    const dialog = await screen.findByRole('dialog', { name: 'Usage locations for First card' });
    fireEvent.click(within(dialog).getByTitle('2'));
    expect(await within(dialog).findByText('Failed to load page 2')).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Retry' }));

    await waitFor(() => {
      expect(mocks.listUsageLocations).toHaveBeenLastCalledWith(expect.anything(), {
        templateId: 'jtt_first',
        page: 2,
        pageSize: 10,
      });
    });
    expect(mocks.listUsageLocations).toHaveBeenCalledTimes(3);
  });

  it('relies on server deletion while disabling obvious in-use and archived entries', async () => {
    mocks.catalog = [
      createCatalogEntry({ id: 'jtt_unused', templateName: 'unused', title: 'Unused entry', usageCount: 0 }),
      createCatalogEntry({ id: 'jtt_used', templateName: 'used', title: 'Used entry', usageCount: 2 }),
      createCatalogEntry({ id: 'jtt_archived', templateName: 'archived', title: 'Archived entry', status: 'archived' }),
    ];
    renderCatalog();
    await screen.findByText('Unused entry');

    expect(screen.getByRole('button', { name: 'Delete JS Template Used entry' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Delete JS Template Archived entry' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Delete JS Template Unused entry' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(mocks.deleteTemplate).toHaveBeenCalledWith(expect.anything(), 'jtt_unused'));
    expect(await screen.findByText('JS Template deleted: Unused entry')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('Unused entry')).not.toBeInTheDocument());
  });

  it('shows the canonical server usage conflict when the catalog count becomes stale before deletion', async () => {
    mocks.catalog = [
      createCatalogEntry({ id: 'jtt_raced', templateName: 'raced', title: 'Raced entry', usageCount: 0 }),
    ];
    mocks.deleteTemplate.mockRejectedValue(
      Object.assign(new Error('Request failed with status code 409'), {
        response: {
          data: {
            errors: [
              {
                code: 'JS_TEMPLATE_USAGE_EXISTS',
                details: { templateId: 'jtt_raced', usageCount: 3 },
              },
            ],
          },
        },
      }),
    );
    renderCatalog();
    await screen.findByText('Raced entry');

    fireEvent.click(screen.getByRole('button', { name: 'Delete JS Template Raced entry' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Delete' }));

    expect(
      await screen.findByText('This JS Template is still used in 3 locations. Detach those usages before deleting it.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Raced entry')).toBeInTheDocument();
  });

  it('uses the localized fallback instead of exposing an untranslated delete error', async () => {
    mocks.catalog = [
      createCatalogEntry({ id: 'jtt_failed', templateName: 'failed', title: 'Failed entry', usageCount: 0 }),
    ];
    mocks.deleteTemplate.mockRejectedValue(
      Object.assign(new Error('Request failed with status code 422'), {
        response: {
          data: {
            errors: [
              { code: 'JS_TEMPLATE_SOURCE_ERROR', message: 'JS Template entry descriptor is missing from source' },
            ],
          },
        },
      }),
    );
    renderCatalog();
    await screen.findByText('Failed entry');

    fireEvent.click(screen.getByRole('button', { name: 'Delete JS Template Failed entry' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('Failed to delete JS Template')).toBeInTheDocument();
    expect(screen.queryByText('JS Template entry descriptor is missing from source')).not.toBeInTheDocument();
  });
});

function renderCatalog() {
  const app = createMockClient();
  return render(
    <FlowEngineProvider engine={app.flowEngine}>
      <MemoryRouter initialEntries={['/admin/settings/js-templates']}>
        <JsTemplateCatalogPage />
      </MemoryRouter>
    </FlowEngineProvider>,
  );
}

function createCatalogEntry(overrides: Partial<JsTemplateCatalogEntry>): JsTemplateCatalogEntry {
  return {
    id: 'jtt_entry',
    projectId: 'jtp_shared',
    projectName: 'shared-source',
    projectTitle: 'Shared source',
    projectLifecycleStatus: 'enabled',
    kind: 'js-block',
    templateName: 'entry',
    title: 'Entry',
    description: null,
    healthStatus: 'ready',
    status: 'ready',
    usageCount: 0,
    createdAt: '2026-08-04T00:00:00.000Z',
    updatedAt: '2026-08-04T00:00:00.000Z',
    ...overrides,
  };
}

function createJob(): JsTemplateCreateJobSummary {
  return {
    id: 'jtcj_new',
    targetProjectId: 'jtp_new',
    name: 'new-source',
    title: 'New card',
    description: null,
    sourceType: 'starter',
    status: 'pending',
    errorCode: null,
    errorMessage: null,
    startedAt: null,
    finishedAt: null,
    createdAt: '2026-08-04T00:00:00.000Z',
    updatedAt: '2026-08-04T00:00:00.000Z',
  };
}

function createUsageListResult(templateId: string, locationTitle: string) {
  return {
    data: [
      {
        id: `jtu_${templateId}`,
        projectId: 'jtp_shared',
        templateId,
        kind: 'js-block' as const,
        ownerKind: 'flowModel.step' as const,
        ownerLocator: {
          kind: 'flowModel.step' as const,
          modelUid: `fm_${templateId}`,
          use: 'JSBlockModel' as const,
          stepPath: ['stepParams', 'jsSettings'] as const,
        },
        ownerLocatorHash: `sha256:${templateId}`,
        settingsHash: 'sha256:settings',
        resolvedStatus: 'active' as const,
        ownerTitle: locationTitle,
        locationTitle,
        routeId: null,
      },
    ],
    meta: { page: 1, pageSize: 10, count: 1, totalPage: 1, effectiveCount: 1, hiddenCount: 0 },
  };
}
