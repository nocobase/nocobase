/**
 * A project's Releases tab, shown when its repositories deploy to production or build previews: what runs on each
 * staging and production App (release, commit, who deployed and approved it; `../../deploys/environments.tsx`), the
 * finished issues
 * whose change is not in production yet, each marked when it is on staging already (with a production link), and its
 * issues' previews with their state and a link to each (with a preview link). Drawn with the installed
 * `project-detail` block over Studio's deployments and previews.
 */
import { useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement, ReactNode } from 'react';
import { Link } from 'react-router';

import type { IssueTableColor } from '@/components/issue-table';
import { ProjectSection } from '@/extensions/nocobase-project-detail/project-detail';
import {
  PreviewList,
  UnreleasedChanges,
  type Loaded,
  type PreviewItem,
  type UnreleasedItem,
} from '@/extensions/nocobase-project-detail/project-releases';

import type {
  PreviewListItem,
  PreviewStatus,
} from '../../../shared/previews.js';
import { EnvironmentRows } from '../../deploys/environments.js';
import { useProjectEnvironments } from '../../deploys/use-environments.js';
import {
  absoluteUrl,
  previewKeys,
  readProjectPreviews,
} from '../../previews/api.js';
import { useProjectPage } from './context.js';
import { useProjectPageWording } from './labels.js';

const STATUS_COLOR: Readonly<Record<PreviewStatus, IssueTableColor>> = {
  waiting: 'gray',
  deploying: 'blue',
  ready: 'green',
  blocked: 'yellow',
  failed: 'red',
  destroyed: 'gray',
};

function RouterLink({
  href,
  className,
  children,
}: {
  readonly href: string;
  readonly className?: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <Link to={href} className={className}>
      {children}
    </Link>
  );
}

const issueHref = (identifier: string): string =>
  `/issues/${encodeURIComponent(identifier)}`;

export function ProjectReleases(): ReactElement {
  const { project, releases } = useProjectPage();
  const { t } = useTranslation();
  const { detail: labels } = useProjectPageWording();
  const api = useApiClient();
  const previews = useQuery({
    queryKey: previewKeys.project(project.id),
    queryFn: () => readProjectPreviews(api, project.id),
    enabled: releases?.hasPreview === true,
  });
  const environments = useProjectEnvironments(project.id);

  const unreleased: Loaded<UnreleasedItem> = releases
    ? {
        state: 'ready',
        items: releases.items.map((issue) => ({
          id: issue.id,
          identifier: issue.identifier,
          title: issue.title,
          href: issueHref(issue.identifier),
          staging: issue.staging,
        })),
      }
    : { state: 'loading' };
  const previewItem = (preview: PreviewListItem): PreviewItem => ({
    id: preview.id,
    identifier: preview.identifier,
    title: preview.title,
    href: issueHref(preview.identifier),
    status: {
      name: t(`previews.statuses.${preview.status}`),
      color: STATUS_COLOR[preview.status],
    },
    runtime:
      preview.status === 'ready' && preview.runtime
        ? t(`previews.runtime.${preview.runtime.state}`)
        : null,
    app: [
      preview.pullRequest ? `#${preview.pullRequest.number}` : null,
      preview.targetAppName ?? preview.targetAppId ?? preview.appId,
    ]
      .filter(Boolean)
      .join(' · '),
    url: preview.url ? absoluteUrl(preview.url) : null,
  });
  const previewList: Loaded<PreviewItem> = previews.data
    ? { state: 'ready', items: previews.data.map(previewItem) }
    : previews.isError
      ? { state: 'error' }
      : { state: 'loading' };

  return (
    <div className='max-w-3xl space-y-3'>
      {environments.data && environments.data.items.length > 0 ? (
        <ProjectSection
          title={t('deploys.environments.title')}
          description={t('deploys.environments.description')}
        >
          <EnvironmentRows projectId={project.id} />
        </ProjectSection>
      ) : null}
      {releases?.hasProduction ? (
        <UnreleasedChanges
          list={unreleased}
          link={RouterLink}
          labels={labels}
        />
      ) : null}
      {releases?.hasPreview ? (
        <PreviewList list={previewList} link={RouterLink} labels={labels} />
      ) : null}
    </div>
  );
}
