/**
 * A project's Releases tab, presented: its finished issues whose change is not in production yet, each marked when it
 * is on staging already, and the issues' previews running now with a link to each. Purely presentational: the
 * consumer gives the lists, each loading, failed or loaded, and the links.
 */
import { BoxIcon, ExternalLinkIcon, GitBranchIcon } from 'lucide-react';
import type { ReactElement } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { IssueStatusBadge } from '@/components/issue-table';
import {
  defaultProjectDetailLabels,
  fill,
  type ProjectDetailLabels,
} from './labels.js';
import {
  ProjectSection,
  type ProjectDetailLink,
  type ProjectDetailStatus,
} from './project-detail.js';

const PlainLink: ProjectDetailLink = ({ href, className, children }) => (
  <a href={href} className={className}>
    {children}
  </a>
);

/** A list still loading, one that failed to load, or the loaded items. */
export type Loaded<T> =
  | { readonly state: 'loading' }
  | { readonly state: 'error' }
  | { readonly state: 'ready'; readonly items: readonly T[] };

export interface UnreleasedItem {
  readonly id: string;
  readonly identifier: string;
  readonly title: string;
  /** The issue's page. */
  readonly href: string;
  readonly staging: boolean;
}

/** "Merged, not released": newest first, as given. */
export function UnreleasedChanges({
  list,
  link: Link = PlainLink,
  labels = defaultProjectDetailLabels,
}: {
  readonly list: Loaded<UnreleasedItem>;
  readonly link?: ProjectDetailLink;
  readonly labels?: ProjectDetailLabels;
}): ReactElement {
  const words = labels.unreleased;
  return (
    <ProjectSection
      title={
        list.state === 'ready' && list.items.length > 0
          ? `${words.title} · ${list.items.length}`
          : words.title
      }
      description={words.description}
    >
      {list.state === 'loading' ? (
        <Skeleton className='h-12 w-full' />
      ) : list.state === 'error' ? (
        <p className='text-sm text-muted-foreground'>{words.loadFailed}</p>
      ) : list.items.length === 0 ? (
        <p className='text-sm text-muted-foreground'>{words.empty}</p>
      ) : (
        <ul className='space-y-1'>
          {list.items.map((issue) => (
            <li
              key={issue.id}
              className='flex min-w-0 items-center gap-2 text-sm'
            >
              <Link
                href={issue.href}
                className='shrink-0 font-mono text-xs text-muted-foreground hover:underline'
              >
                {issue.identifier}
              </Link>
              <span className='min-w-0 truncate'>{issue.title}</span>
              {issue.staging ? (
                <Badge variant='secondary' className='ml-auto shrink-0'>
                  {words.staging}
                </Badge>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </ProjectSection>
  );
}

export interface PreviewItem {
  readonly id: string;
  readonly identifier: string;
  readonly title: string;
  /** The issue's page. */
  readonly href: string;
  readonly status: ProjectDetailStatus;
  /** Where the running App stands, in words, such as "Stopped (starts on visit)". */
  readonly runtime?: string | null;
  /** The App it previews, when an issue has previews of several. */
  readonly app?: string | null;
  readonly branch?: string | null;
  /** The preview App's address; no link without one. */
  readonly url?: string | null;
}

/** The previews running now, one row per issue and App. */
export function PreviewList({
  list,
  link: Link = PlainLink,
  labels = defaultProjectDetailLabels,
}: {
  readonly list: Loaded<PreviewItem>;
  readonly link?: ProjectDetailLink;
  readonly labels?: ProjectDetailLabels;
}): ReactElement {
  const words = labels.previews;
  return (
    <ProjectSection
      title={
        list.state === 'ready' && list.items.length > 0
          ? `${words.title} · ${list.items.length}`
          : words.title
      }
      description={words.description}
    >
      {list.state === 'loading' ? (
        <Skeleton className='h-12 w-full' />
      ) : list.state === 'error' ? (
        <p className='text-sm text-muted-foreground'>{words.loadFailed}</p>
      ) : list.items.length === 0 ? (
        <p className='text-sm text-muted-foreground'>{words.empty}</p>
      ) : (
        <ul className='divide-y'>
          {list.items.map((preview) => (
            <li
              key={preview.id}
              className='flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 py-2 text-sm first:pt-0 last:pb-0'
            >
              <Link
                href={preview.href}
                className='shrink-0 font-mono text-xs text-muted-foreground hover:underline'
              >
                {preview.identifier}
              </Link>
              <span className='min-w-0 flex-1 truncate'>{preview.title}</span>
              <IssueStatusBadge status={preview.status} />
              {preview.runtime ? (
                <span className='text-xs text-muted-foreground'>
                  {preview.runtime}
                </span>
              ) : null}
              {preview.app ? (
                <span className='inline-flex min-w-0 items-center gap-1 text-xs text-muted-foreground'>
                  <BoxIcon className='size-3 shrink-0' aria-hidden='true' />
                  <span className='truncate'>{preview.app}</span>
                </span>
              ) : null}
              {preview.branch ? (
                <span className='inline-flex min-w-0 items-center gap-1 font-mono text-xs text-muted-foreground'>
                  <GitBranchIcon
                    className='size-3 shrink-0'
                    aria-hidden='true'
                  />
                  <span className='truncate'>{preview.branch}</span>
                </span>
              ) : null}
              {preview.url ? (
                <Button
                  variant='ghost'
                  size='icon-xs'
                  nativeButton={false}
                  aria-label={fill(words.open, {
                    identifier: preview.identifier,
                  })}
                  render={
                    <a href={preview.url} target='_blank' rel='noreferrer' />
                  }
                >
                  <ExternalLinkIcon />
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </ProjectSection>
  );
}
