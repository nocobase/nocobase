/**
 * What the view shows with nothing open: the space's home. It lists what is worth a look: the latest updates, the
 * proposals waiting, the documents never verified or not verified for a long while, and, while semantic search is on,
 * the documents whose sections are not all indexed yet (failed first). A space with no documents says
 * so, with the way to start one: write or upload, or propose a file for someone who may only propose. Otherwise adding
 * goes through the view's New menu.
 */
import { useTranslation } from '@nocobase/i18n/client';
import {
  BadgeCheckIcon,
  BookOpenIcon,
  ChevronRightIcon,
  ClockIcon,
  FilePlusIcon,
  FileUpIcon,
  InboxIcon,
  ScanSearchIcon,
  UploadIcon,
} from 'lucide-react';
import { useState, type ReactElement, type ReactNode } from 'react';

import { Button } from './ui/button.js';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from './ui/empty.js';

import { ACCESS_NAMESPACE } from '../../shared/access.js';
import type {
  KnowledgeDocSummary,
  KnowledgeProposal,
  SpaceRef,
} from '../../shared/knowledge.js';
import { useKnowledgeUnindexed } from '../api.js';
import type { EntryActions } from '../lib/entry-actions.js';
import { relativeTime } from '../lib/format.js';
import { EntryIcon } from './file-pane.js';
import { ProposalKindBadge } from './proposal-view.js';

/** A document not verified for this long is worth verifying again. */
const STALE_DAYS = 180;
const LISTED = 5;

function Section({
  icon,
  title,
  action,
  children,
}: {
  readonly icon: ReactNode;
  readonly title: string;
  readonly action?: ReactNode;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <section className='space-y-2'>
      <div className='flex items-center gap-2'>
        <span className='text-muted-foreground [&_svg]:size-4'>{icon}</span>
        <h2 className='text-sm font-medium'>{title}</h2>
        {action ? <div className='ml-auto'>{action}</div> : null}
      </div>
      <ul className='divide-y rounded-lg border'>{children}</ul>
    </section>
  );
}

function Row({
  onClick,
  children,
  aside,
}: {
  readonly onClick: () => void;
  readonly children: ReactNode;
  readonly aside?: ReactNode;
}): ReactElement {
  return (
    <li>
      <button
        type='button'
        className='flex w-full min-w-0 items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted'
        onClick={onClick}
      >
        <span className='flex min-w-0 flex-1 items-center gap-2'>
          {children}
        </span>
        {aside ? (
          <span className='shrink-0 text-xs text-muted-foreground'>
            {aside}
          </span>
        ) : null}
      </button>
    </li>
  );
}

export function SpaceHome({
  space = null,
  spaceLabel,
  docs,
  ownDocs,
  pending,
  actions,
  onOpen,
  onProposal,
  onProposals,
}: {
  /** The space shown, whose unindexed documents are listed; none to list none. */
  readonly space?: SpaceRef | null;
  readonly spaceLabel: string;
  /** Every entry of the view, the inherited ones too. */
  readonly docs: readonly KnowledgeDocSummary[];
  /** The entries of the space shown. */
  readonly ownDocs: readonly KnowledgeDocSummary[];
  readonly pending: readonly KnowledgeProposal[];
  readonly actions: EntryActions | null;
  readonly onOpen: (docId: string) => void;
  readonly onProposal: (id: string) => void;
  readonly onProposals: () => void;
}): ReactElement {
  const { t, i18n } = useTranslation(ACCESS_NAMESPACE);
  const [now] = useState(() => Date.now());
  const unindexed = useKnowledgeUnindexed(space).data ?? [];
  const edit = !!actions?.access.edit;
  const propose = !edit && !!actions?.access.propose;
  const start = edit ? (
    <>
      <Button onClick={() => actions.newEntry('article', null)}>
        <FilePlusIcon data-icon='inline-start' />
        {t('knowledge.new.article')}
      </Button>
      <Button variant='outline' onClick={() => actions.upload(null)}>
        <UploadIcon data-icon='inline-start' />
        {t('knowledge.files.upload')}
      </Button>
    </>
  ) : propose ? (
    <Button onClick={() => actions.proposeFile()}>
      <FileUpIcon data-icon='inline-start' />
      {t('knowledge.files.proposeNew')}
    </Button>
  ) : null;

  const live = ownDocs.filter((doc) => !doc.archivedAt);
  if (live.length === 0)
    return (
      <Empty
        className='min-h-80 border border-dashed'
        data-testid='knowledge-home'
      >
        <EmptyHeader>
          <EmptyMedia variant='icon'>
            <BookOpenIcon />
          </EmptyMedia>
          <EmptyTitle>
            {t('knowledge.home.emptyTitle', { space: spaceLabel })}
          </EmptyTitle>
          <EmptyDescription>
            {edit
              ? t('knowledge.home.emptyEdit')
              : propose
                ? t('knowledge.home.emptyPropose')
                : t('knowledge.home.emptyRead')}
          </EmptyDescription>
        </EmptyHeader>
        {start ? (
          <EmptyContent className='flex-row justify-center'>
            {start}
          </EmptyContent>
        ) : null}
      </Empty>
    );

  const readable = docs.filter(
    (doc) => !doc.archivedAt && doc.kind !== 'folder',
  );
  const recent = readable
    .slice()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, LISTED);
  const limit = now - STALE_DAYS * 24 * 3600 * 1000;
  const unverified = live
    .filter(
      (doc) =>
        doc.kind !== 'folder' &&
        (!doc.verifiedAt || new Date(doc.verifiedAt).getTime() < limit),
    )
    .sort((a, b) => (a.verifiedAt ?? '').localeCompare(b.verifiedAt ?? ''))
    .slice(0, LISTED);
  return (
    <div className='mx-auto max-w-3xl space-y-8' data-testid='knowledge-home'>
      <header className='space-y-1'>
        <h2 className='font-heading text-2xl font-semibold tracking-tight'>
          {spaceLabel}
        </h2>
        <p className='text-sm text-muted-foreground'>
          {t('knowledge.home.count', { count: live.length })}
        </p>
      </header>
      {pending.length > 0 ? (
        <Section
          icon={<InboxIcon />}
          title={t('knowledge.home.pending', { count: pending.length })}
          action={
            <Button variant='ghost' onClick={onProposals}>
              {t('knowledge.home.all')}
              <ChevronRightIcon data-icon='inline-end' />
            </Button>
          }
        >
          {pending.slice(0, LISTED).map((item) => (
            <Row
              key={item.id}
              onClick={() => onProposal(item.id)}
              aside={relativeTime(item.createdAt, i18n.language)}
            >
              <ProposalKindBadge proposal={item} />
              <span className='truncate'>{item.docTitle || item.title}</span>
            </Row>
          ))}
        </Section>
      ) : null}
      {recent.length > 0 ? (
        <Section icon={<ClockIcon />} title={t('knowledge.home.recent')}>
          {recent.map((doc) => (
            <Row
              key={doc.id}
              onClick={() => onOpen(doc.id)}
              aside={t('knowledge.home.updated', {
                time: relativeTime(doc.updatedAt, i18n.language),
                name: doc.updatedBy.name ?? t('knowledge.someone'),
              })}
            >
              <EntryIcon entry={doc} />
              <span className='truncate'>{doc.title}</span>
            </Row>
          ))}
        </Section>
      ) : null}
      {unindexed.length > 0 ? (
        <Section
          icon={<ScanSearchIcon />}
          title={t('knowledge.home.unindexed')}
        >
          {unindexed.slice(0, LISTED * 2).map((doc) => (
            <Row
              key={doc.docId}
              onClick={() => onOpen(doc.docId)}
              aside={
                doc.failed > 0
                  ? t('knowledge.home.unindexedFailed', {
                      failed: doc.failed,
                      pending: doc.pending,
                    })
                  : t('knowledge.home.unindexedPending', {
                      count: doc.pending,
                    })
              }
            >
              <EntryIcon entry={{ kind: doc.kind, file: null }} />
              <span className='truncate'>{doc.title}</span>
            </Row>
          ))}
        </Section>
      ) : null}
      {unverified.length > 0 ? (
        <Section
          icon={<BadgeCheckIcon />}
          title={t('knowledge.home.unverified')}
        >
          {unverified.map((doc) => (
            <Row
              key={doc.id}
              onClick={() => onOpen(doc.id)}
              aside={
                doc.verifiedAt
                  ? t('knowledge.home.verifiedAgo', {
                      time: relativeTime(doc.verifiedAt, i18n.language),
                    })
                  : t('knowledge.doc.notVerified')
              }
            >
              <EntryIcon entry={doc} />
              <span className='truncate'>{doc.title}</span>
            </Row>
          ))}
        </Section>
      ) : null}
    </div>
  );
}
