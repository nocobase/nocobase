/**
 * Cards under an agent's reply for the issues, projects and knowledge documents it mentions (`references.ts`):
 * key, title and state, linking to the page. Each card reads
 * the same cached record its page does, as the viewer sees it; one that cannot be read (no access, deleted, a key
 * that is no issue) renders nothing, and the mention stays plain text in the message.
 */
import {
  statusTone,
  useStatusName,
} from '@nocobase/app-plugin-projects/client/issues';
import {
  PmTag,
  pmKeys,
  usePmApi,
} from '@nocobase/app-plugin-projects/client/kit';
import { useTranslation } from '@nocobase/i18n/client';
import { useQuery } from '@tanstack/react-query';
import { BookOpenIcon, FolderKanbanIcon, SquareCheckIcon } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';
import { Link } from 'react-router';

import { IssueCard } from '@/components/issue-card';

import { knowledgeDocPath } from '../../shared/knowledge.js';
import { useKnowledgeDoc } from '@nocobase/app-plugin-knowledge/client/api';
import { IssueCardRouterLink } from '../issues/issue-card-link.js';
import { toneColor } from '../issues/rows.js';
import { referencesIn, type ChatReference } from './references.js';

const QUIET = { retry: false, staleTime: 30_000 } as const;

export function ReferenceCards({
  content,
}: {
  readonly content: string;
}): ReactElement | null {
  const { t } = useTranslation();
  const references = referencesIn(content);
  if (references.length === 0) return null;
  return (
    <ul
      className='mt-2 flex w-full min-w-0 flex-col gap-1.5'
      aria-label={t('studioAgents.references.label')}
      data-testid='chat-reference-cards'
    >
      {references.map((reference) => (
        <ReferenceCard key={reference.key} reference={reference} />
      ))}
    </ul>
  );
}

function ReferenceCard({
  reference,
}: {
  readonly reference: ChatReference;
}): ReactElement | null {
  if (reference.type === 'project') return <ProjectCard id={reference.value} />;
  if (reference.type === 'knowledgeDoc')
    return <KnowledgeCard id={reference.value} />;
  return <IssueReference idOrKey={reference.value} />;
}

function IssueReference({
  idOrKey,
}: {
  readonly idOrKey: string;
}): ReactElement | null {
  const api = usePmApi();
  const statusName = useStatusName();
  const issue = useQuery({
    queryKey: pmKeys.issue(idOrKey),
    queryFn: () => api.issue(idOrKey),
    ...QUIET,
  });
  if (!issue.data) return null;
  const { identifier, statusKey, statuses } = issue.data;
  return (
    <li className='min-w-0'>
      <IssueCard
        issue={{
          id: issue.data.id,
          identifier,
          title: issue.data.title,
          status: {
            name: statusName(statuses, statusKey),
            color: toneColor(statusTone(statuses, statusKey)),
          },
        }}
        href={`/issues/${encodeURIComponent(identifier)}`}
        link={IssueCardRouterLink}
        leading={<SquareCheckIcon aria-hidden='true' />}
      />
    </li>
  );
}

function ProjectCard({ id }: { readonly id: string }): ReactElement | null {
  const { t } = useTranslation();
  const api = usePmApi();
  const project = useQuery({
    queryKey: pmKeys.project(id),
    queryFn: () => api.project(id),
    ...QUIET,
  });
  if (!project.data) return null;
  return (
    <Card
      to={`/projects/${encodeURIComponent(project.data.id)}`}
      icon={<FolderKanbanIcon aria-hidden='true' />}
      title={project.data.name}
      tag={<PmTag tone='grey'>{t('studioAgents.references.project')}</PmTag>}
    />
  );
}

function KnowledgeCard({ id }: { readonly id: string }): ReactElement | null {
  const { t } = useTranslation();
  const doc = useKnowledgeDoc(id);
  if (!doc.data) return null;
  return (
    <Card
      to={knowledgeDocPath(
        { scope: doc.data.scope, scopeId: doc.data.scopeId },
        doc.data.id,
      )}
      icon={<BookOpenIcon aria-hidden='true' />}
      title={doc.data.title}
      tag={<PmTag tone='grey'>{t('studioAgents.references.knowledge')}</PmTag>}
    />
  );
}

function Card({
  to,
  icon,
  title,
  tag,
}: {
  readonly to: string;
  readonly icon: ReactNode;
  readonly title: string;
  readonly tag: ReactNode;
}): ReactElement {
  return (
    <li className='min-w-0'>
      <Link
        to={to}
        className='flex min-h-9 min-w-0 items-center gap-2 rounded-md border bg-background px-2.5 py-1.5 text-sm hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-muted-foreground'
      >
        {icon}
        <span className='min-w-0 flex-1 truncate' title={title}>
          {title}
        </span>
        <span className='shrink-0'>{tag}</span>
      </Link>
    </li>
  );
}
