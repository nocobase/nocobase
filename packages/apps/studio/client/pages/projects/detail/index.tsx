/**
 * Route `/projects/:projectId`: a project's page, a covering child page over the project list. The header carries the
 * progress ring, name, status, lead, dates, workflow and progress, with "Ask agent", "New issue" (the projects
 * plugin's dialog over the tab shown, `<tab>/new-issue`) and deleting the project; below it the tabs are child routes —
 * Overview, Issues, Knowledge, Members, Releases (only when the project's repositories deploy to production or build
 * previews) and Settings (only for those who may manage the project). The bare URL opens Overview. The page is the
 * installed `project-detail` block over the projects plugin's headless hooks
 * (`@nocobase/app-plugin-projects/client/projects`), in its words, with Studio's own tabs and sections.
 */
import {
  ApiClientError,
  useApiClient,
  usePageBreadcrumb,
} from '@nocobase/app-client';
import {
  canCreateIssues,
  canDeleteProjects,
  canManageProject,
  progressFromCounts,
  projectStatusSuffix,
  projectStatusTone,
  useDeleteProject,
  useProjectDetail,
  useProjectStatuses,
  useProjectWorkflow,
} from '@nocobase/app-plugin-projects/client/projects';
import {
  PmDetailSkeleton,
  PmLoadError,
  useNewIssueShortcut,
  usePageContextSource,
  useViewer,
} from '@nocobase/app-plugin-projects/client/kit';
import type { ProjectDetail } from '@nocobase/app-plugin-projects/shared/projects';
import { useTranslation } from '@nocobase/i18n/client';
import { useQuery } from '@tanstack/react-query';
import { PlusIcon } from 'lucide-react';
import { useMemo, useState, type ReactElement } from 'react';
import {
  Link,
  Navigate,
  Outlet,
  useLocation,
  useMatch,
  useNavigate,
  useParams,
} from 'react-router';

import { PageContainer } from '@/components/page-container';
import { RefreshButton } from '@/components/refresh-button';
import { RouteChildPage } from '@/components/route-child-page';
import { RouteTabs } from '@/components/route-tabs';
import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/kbd';
import { useRefreshQueries } from '@/components/use-refresh-queries';
import {
  ProjectDeleteMenu,
  ProjectHeader,
} from '@/extensions/nocobase-project-detail/project-detail';

import { AskAgent } from '../../../agents/ask-agent.js';
import { toneColor } from '../../../issues/rows.js';
import { useReturnLocations } from '../../../layouts/return-locations.js';
import { previewKeys, readUnreleased } from '../../../previews/api.js';
import {
  hasReleases,
  type ProjectPageContext,
} from '../../../projects/detail/context.js';
import { formatDateOnly } from '../../../projects/detail/dates.js';
import { useProjectPageWording } from '../../../projects/detail/labels.js';

export default function ProjectDetailPage(): ReactElement {
  const { projectId = '' } = useParams();
  return (
    <RouteChildPage>
      <ProjectLoader key={projectId} projectId={projectId} />
    </RouteChildPage>
  );
}

function ProjectLoader({
  projectId,
}: {
  readonly projectId: string;
}): ReactElement {
  const { t } = useProjectPageWording();
  const { projectsList } = useReturnLocations();
  const project = useProjectDetail(projectId);
  if (project.isError && !project.data) {
    const missing =
      project.error instanceof ApiClientError &&
      [403, 404].includes(project.error.status);
    return (
      <PageContainer>
        <PmLoadError
          title={t('projects.detailLoadFailed')}
          error={project.error}
          notFound={t('projects.notFound')}
          {...(missing
            ? {
                action: (
                  <Button
                    variant='outline'
                    size='sm'
                    nativeButton={false}
                    render={<Link to={projectsList} />}
                  >
                    {t('projects.backToList')}
                  </Button>
                ),
              }
            : { onRetry: () => void project.refetch() })}
        />
      </PageContainer>
    );
  }
  if (!project.data) return <PmDetailSkeleton />;
  return <ProjectPage project={project.data} />;
}

type TabPath =
  'overview' | 'issues' | 'knowledge' | 'members' | 'releases' | 'settings';

function ProjectPage({
  project,
}: {
  readonly project: ProjectDetail;
}): ReactElement {
  const { t, studio, detail: labels } = useProjectPageWording();
  const { projectsList } = useReturnLocations();
  const { i18n } = useTranslation();
  const api = useApiClient();
  const viewer = useViewer();
  const navigate = useNavigate();
  const location = useLocation();
  const refresh = useRefreshQueries();
  const base = `/projects/${encodeURIComponent(project.id)}`;
  const atRoot = useMatch('/projects/:projectId') !== null;
  const tabMatch = useMatch('/projects/:projectId/:tab/*');
  const statuses = useProjectStatuses(project.id);
  const workflow = useProjectWorkflow(project);
  const releases = useQuery({
    queryKey: previewKeys.unreleased(project.id),
    queryFn: () => readUnreleased(api, project.id),
  });
  const deleteProject = useDeleteProject(project);
  const canEdit = canManageProject(viewer, project);
  const canCreate = canCreateIssues(viewer);
  const entry = useMemo(
    () => ({ kind: 'project', id: project.id, label: project.name }) as const,
    [project.id, project.name],
  );
  usePageContextSource(entry);
  // The header's trail: the list as the person left it, then this project.
  usePageBreadcrumb([
    { label: t('projects.title'), to: projectsList },
    { label: project.name },
  ]);
  // "New issue" opens over the tab shown, the project preselected; closing or creating stays on this page.
  const view = tabMatch?.params.tab ?? 'overview';
  const newIssueLink = {
    pathname: `${base}/${view}/new-issue`,
    search: location.search,
  };
  const shortcutAnchor = useNewIssueShortcut({
    canCreate,
    onCreate: () => void navigate(newIssueLink),
  });

  const progress = progressFromCounts(project.issueCounts);
  const availableReleases = hasReleases(releases.data);
  const [retainedReleases, setRetainedReleases] = useState(false);
  // Retain the active tab after its last preview is cleaned up, until the person leaves it.
  const retain = view === 'releases' && (availableReleases || retainedReleases);
  if (retain !== retainedReleases) setRetainedReleases(retain);
  const withReleases = availableReleases || retain;
  const tabs: { path: TabPath; label: string }[] = [
    { path: 'overview', label: studio('projectPage.tabs.overview') },
    {
      path: 'issues',
      label: `${studio('projectPage.tabs.issues')} ${project.issueCounts.total}`,
    },
    { path: 'knowledge', label: studio('projectPage.tabs.knowledge') },
    {
      path: 'members',
      label: `${studio('projectPage.tabs.members')} ${project.members.length}`,
    },
    ...(withReleases
      ? [
          {
            path: 'releases' as const,
            label: studio('projectPage.tabs.releases'),
          },
        ]
      : []),
    ...(canEdit
      ? [
          {
            path: 'settings' as const,
            label: studio('projectPage.tabs.settings'),
          },
        ]
      : []),
  ];
  const current = tabMatch?.params.tab;
  const active = tabs.find((tab) => tab.path === current);
  // The bare URL, or a tab this viewer does not get or the project has nothing for, opens Overview. Releases waits
  // for the answer that decides it, and Settings for who the viewer is, so a link into a settings section survives a
  // fresh load.
  const deciding =
    (current === 'releases' && !releases.isFetched) ||
    (current === 'settings' && viewer === undefined);
  if (atRoot || (!active && !deciding))
    return (
      <Navigate
        replace
        to={{ pathname: `${base}/overview`, search: location.search }}
      />
    );

  const context: ProjectPageContext = {
    project,
    statuses: statuses.data,
    canEdit,
    canCreateIssues: canCreate,
    releases: releases.data,
  };
  const dates =
    project.startDate || project.dueDate
      ? `${formatDateOnly(project.startDate, i18n.language)} → ${formatDateOnly(project.dueDate, i18n.language)}`
      : null;

  return (
    <PageContainer>
      <ProjectHeader
        name={project.name}
        status={{
          name: t(`projectStatus.${projectStatusSuffix(project.status)}`),
          color: toneColor(projectStatusTone(project.status)),
        }}
        membersOnly={project.visibility === 'members'}
        progress={{
          percent: progress.percent,
          label: t('projects.progressLabel', {
            done: progress.done,
            total: progress.total,
          }),
        }}
        lead={project.lead ? { name: project.lead.name } : null}
        dates={dates}
        workflow={workflow.name}
        actions={
          <>
            <AskAgent placement='project' entry={entry} />
            {canCreate ? (
              <Button nativeButton={false} render={<Link to={newIssueLink} />}>
                <PlusIcon data-icon='inline-start' />
                {t('issues.new')}
                <Kbd data-icon='inline-end' aria-hidden='true'>
                  C
                </Kbd>
              </Button>
            ) : null}
            <span hidden ref={shortcutAnchor} />
            {/* Every tab's reads: previews, builds and the working directory's state change with nothing announcing them. */}
            <RefreshButton onRefresh={refresh} />
            {canDeleteProjects(viewer) ? (
              <ProjectDeleteMenu
                name={project.name}
                labels={labels}
                onDelete={async () => {
                  await deleteProject();
                  void navigate(projectsList);
                }}
              />
            ) : null}
          </>
        }
        labels={labels}
      />
      <div className='space-y-6'>
        <RouteTabs label={studio('projectPage.tabs.label')} tabs={tabs} />
        <div role='tabpanel' aria-label={active?.label}>
          <Outlet context={context} />
        </div>
      </div>
    </PageContainer>
  );
}
