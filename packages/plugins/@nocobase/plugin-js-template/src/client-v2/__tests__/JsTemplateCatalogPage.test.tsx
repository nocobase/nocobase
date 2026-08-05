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
    expect(
      within(screen.getByRole('row', { name: /First card first-card/ })).getByRole('cell', { name: '1' }),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole('row', { name: /Second action second-action/ })).getByRole('cell', { name: '2' }),
    ).toBeInTheDocument();
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
