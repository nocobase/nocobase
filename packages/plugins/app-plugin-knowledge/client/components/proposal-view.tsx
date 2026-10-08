/**
 * Proposals as their deciders read them. `ProposalBody` is a proposal's two tabs: Overview (who proposed it, for whom,
 * from where and why, and the decision with its comment once made) and Changes (its change as a diff from the version
 * it was written against and, when the document moved on since, from the current version; a proposed file with its
 * preview; a new document's content; for a revision, the diff from what was sent back first). `ProposalActions` is
 * the review bar: a comment, Reject, Send back (with what should change, for the agent to propose again) and Accept,
 * "Accept anyway" for a stale one; for one sent back, only Reject. The knowledge view and the inbox both show them; the view also lists the proposals of its
 * spaces by status (`ProposalList`) and shows one with the review bar pinned at the bottom (`ProposalDetail`).
 */
import { ApiClientError } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  CheckIcon,
  FileTextIcon,
  Undo2Icon,
  XIcon,
} from 'lucide-react';
import { useState, type ReactElement } from 'react';

import { Alert, AlertDescription, AlertTitle } from './ui/alert.js';
import { Badge } from './ui/badge.js';
import { Button } from './ui/button.js';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from './ui/empty.js';
import { Input } from './ui/input.js';
import { Skeleton } from './ui/skeleton.js';
import { Spinner } from './ui/spinner.js';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs.js';

import { ACCESS_NAMESPACE } from '../../shared/access.js';
import {
  KNOWLEDGE_COMMENT_MAX,
  type KnowledgeProposal,
  type KnowledgeProposalStatus,
} from '../../shared/knowledge.js';
import { useNotify } from '../hooks/use-notify.js';
import {
  PROPOSAL_LIST_STATUSES,
  type ProposalListStatus,
} from '../hooks/use-view-state.js';
import { relativeTime } from '../lib/format.js';
import {
  knowledgeKeys,
  useKnowledgeApi,
  useKnowledgeProposal,
} from '../api.js';
import { DiffView } from './diff-view.js';
import { FileCard } from './file-pane.js';
import { KnowledgeMarkdown } from './markdown.js';
import { RequestChangesDialog } from './request-changes.js';

export function ProposalKindBadge({
  proposal,
}: {
  readonly proposal: Pick<KnowledgeProposal, 'kind'>;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  return (
    <Badge variant='secondary'>
      {t(`knowledge.proposals.kinds.${proposal.kind}`)}
    </Badge>
  );
}

export function ProposalStatusBadge({
  status,
}: {
  readonly status: KnowledgeProposalStatus;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  return (
    <Badge
      variant={
        status === 'accepted'
          ? 'default'
          : status === 'rejected'
            ? 'destructive'
            : status === 'revising'
              ? 'secondary'
              : 'outline'
      }
      data-testid='knowledge-proposal-status'
    >
      {t(`knowledge.proposals.statuses.${status}`)}
    </Badge>
  );
}

/** Who proposed it: a person, or an agent on behalf of the person who woke it. */
function useProposer(): (proposal: KnowledgeProposal) => string {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  return (proposal) => {
    const proposer = proposal.proposer.name ?? t('knowledge.someone');
    const person = proposal.authorizedBy.name ?? t('knowledge.someone');
    const self =
      proposal.proposer.kind === proposal.authorizedBy.kind &&
      proposal.proposer.id === proposal.authorizedBy.id;
    return self
      ? proposer
      : t('knowledge.proposals.onBehalf', { proposer, person });
  };
}

function Changes({
  proposal,
}: {
  readonly proposal: KnowledgeProposal;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  if (proposal.origin === 'document')
    return (
      <p className='text-sm text-muted-foreground'>
        {t('knowledge.revisions.documentNote', {
          version: proposal.baseVersion,
        })}
      </p>
    );
  if (proposal.kind === 'verify')
    return (
      <p className='text-sm text-muted-foreground'>
        {t('knowledge.proposals.verifyNote')}
      </p>
    );
  // A revision of a proposal sent back: what changed since, first.
  const revised =
    proposal.replaces?.origin === 'proposal' &&
    proposal.replacedContent !== undefined &&
    proposal.replacedContent !== null &&
    !proposal.file ? (
      <DiffView
        before={proposal.replacedContent}
        after={proposal.content ?? ''}
        label={t('knowledge.revisions.diffSentBack')}
      />
    ) : null;
  if (proposal.file)
    return (
      <section className='space-y-2'>
        <h3 className='text-sm font-medium'>
          {proposal.kind === 'create'
            ? t('knowledge.proposals.newFile')
            : t('knowledge.proposals.replacementFile', {
                base: proposal.baseVersion,
              })}
        </h3>
        <FileCard file={proposal.file} at={proposal.createdAt} />
        <p className='text-xs text-muted-foreground'>
          {t('knowledge.proposals.fileNote')}
        </p>
      </section>
    );
  if (proposal.kind === 'create')
    return (
      <div className='space-y-6'>
        {revised}
        <section className='space-y-2'>
          <h3 className='text-sm font-medium'>
            {t('knowledge.proposals.newContent')}
          </h3>
          <div className='rounded-lg border p-4'>
            <KnowledgeMarkdown content={proposal.content ?? ''} />
          </div>
        </section>
      </div>
    );
  return (
    <div className='space-y-6'>
      {revised}
      <DiffView
        before={proposal.baseContent ?? ''}
        after={proposal.content ?? ''}
        label={t('knowledge.proposals.diffProposed', {
          base: proposal.baseVersion,
        })}
      />
      {proposal.stale ? (
        <DiffView
          before={proposal.currentContent ?? ''}
          after={proposal.content ?? ''}
          label={t('knowledge.proposals.diffCurrent', {
            current: proposal.currentVersion,
          })}
        />
      ) : null}
    </div>
  );
}

/** The proposal's facts and change, without actions. */
export function ProposalBody({
  proposal,
}: {
  readonly proposal: KnowledgeProposal;
}): ReactElement {
  const { t, i18n } = useTranslation(ACCESS_NAMESPACE);
  const proposer = useProposer();
  return (
    <div className='min-w-0 space-y-4' data-testid='knowledge-proposal'>
      <div className='flex flex-wrap items-center gap-2 text-sm text-muted-foreground'>
        <ProposalKindBadge proposal={proposal} />
        <ProposalStatusBadge status={proposal.status} />
        <span>{proposer(proposal)}</span>
        <span>· {relativeTime(proposal.createdAt, i18n.language)}</span>
        {proposal.source?.title ? (
          <span>
            · {t('knowledge.proposals.from', { source: proposal.source.title })}
          </span>
        ) : null}
      </div>
      {proposal.status === 'revising' ? (
        <Alert>
          <Undo2Icon />
          <AlertTitle>{t('knowledge.revisions.waitingTitle')}</AlertTitle>
          <AlertDescription>
            {t('knowledge.revisions.waiting', {
              name: proposal.proposer.name ?? t('knowledge.someone'),
            })}
          </AlertDescription>
        </Alert>
      ) : proposal.status === 'superseded' ? (
        <Alert>
          <AlertDescription>
            {t('knowledge.revisions.superseded')}
          </AlertDescription>
        </Alert>
      ) : null}
      {proposal.stale && proposal.status === 'pending' ? (
        <Alert>
          <AlertTriangleIcon />
          <AlertTitle>{t('knowledge.proposals.staleTitle')}</AlertTitle>
          <AlertDescription>
            {t('knowledge.proposals.stale', {
              base: proposal.baseVersion,
              current: proposal.currentVersion,
            })}
          </AlertDescription>
        </Alert>
      ) : null}
      <Tabs defaultValue='overview'>
        <TabsList variant='line'>
          <TabsTrigger value='overview'>
            {t('knowledge.proposals.overview')}
          </TabsTrigger>
          <TabsTrigger value='changes'>
            {t('knowledge.proposals.changes')}
          </TabsTrigger>
        </TabsList>
        <TabsContent value='overview' className='pt-2'>
          <dl className='grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[8rem_minmax(0,1fr)]'>
            {proposal.replaces ? (
              <>
                <dt className='font-medium'>
                  {t('knowledge.revisions.revises')}
                </dt>
                <dd
                  className='wrap-anywhere text-muted-foreground'
                  data-testid='knowledge-proposal-revises'
                >
                  {t(
                    proposal.replaces.origin === 'document'
                      ? 'knowledge.revisions.revisesDocument'
                      : 'knowledge.revisions.revisesProposal',
                    {
                      name:
                        proposal.replaces.requestedBy?.name ??
                        t('knowledge.someone'),
                    },
                  )}
                  {proposal.replaces.comment
                    ? `: ${proposal.replaces.comment}`
                    : ''}
                </dd>
              </>
            ) : null}
            <dt className='font-medium'>{t('knowledge.proposals.reason')}</dt>
            <dd className='wrap-anywhere text-muted-foreground'>
              {proposal.reason}
            </dd>
            {proposal.summary ? (
              <>
                <dt className='font-medium'>
                  {t('knowledge.proposals.summary')}
                </dt>
                <dd className='text-muted-foreground'>{proposal.summary}</dd>
              </>
            ) : null}
            {proposal.decidedBy ? (
              <>
                <dt className='font-medium'>
                  {t('knowledge.proposals.decision')}
                </dt>
                <dd className='text-muted-foreground'>
                  {proposal.status === 'revising' ||
                  proposal.status === 'superseded'
                    ? t('knowledge.revisions.sentBackBy', {
                        name: proposal.decidedBy.name ?? t('knowledge.someone'),
                      })
                    : t('knowledge.proposals.decided', {
                        outcome: t(
                          `knowledge.proposals.statuses.${proposal.status}`,
                        ),
                        name: proposal.decidedBy.name ?? t('knowledge.someone'),
                      })}
                  {proposal.decidedAt
                    ? ` · ${relativeTime(proposal.decidedAt, i18n.language)}`
                    : ''}
                </dd>
              </>
            ) : null}
            {proposal.comment ? (
              <>
                <dt className='font-medium'>
                  {t('knowledge.proposals.commentLabel')}
                </dt>
                <dd className='wrap-anywhere text-muted-foreground'>
                  {proposal.comment}
                </dd>
              </>
            ) : null}
          </dl>
        </TabsContent>
        <TabsContent value='changes' className='pt-2'>
          <Changes proposal={proposal} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * The review bar: a comment, Reject, Send back and Accept (Accept anyway for a stale one); for one sent back, Reject
 * alone.
 */
export function ProposalActions({
  proposal,
  onDecided,
}: {
  readonly proposal: KnowledgeProposal;
  readonly onDecided?: () => void;
}): ReactElement | null {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const api = useKnowledgeApi();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState('');
  const [stale, setStale] = useState(proposal.stale);
  const [sendingBack, setSendingBack] = useState(false);
  const decide = useMutation({
    mutationFn: (input: {
      readonly decision: 'accept' | 'reject';
      readonly confirmStale?: boolean;
    }) =>
      api.decide(proposal.id, input.decision, {
        ...(comment.trim() ? { comment: comment.trim() } : {}),
        ...(input.confirmStale ? { confirmStale: true } : {}),
      }),
    onSuccess: (_, input) => {
      notify.success(
        t(
          input.decision === 'accept'
            ? 'knowledge.proposals.accepted'
            : 'knowledge.proposals.rejected',
        ),
      );
      onDecided?.();
    },
    onError: (error) => {
      if (
        error instanceof ApiClientError &&
        error.reason === 'KNOWLEDGE_PROPOSAL_STALE'
      ) {
        setStale(true);
        void queryClient.invalidateQueries({
          queryKey: knowledgeKeys.proposal(proposal.id),
        });
        return;
      }
      notify.error(error);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: knowledgeKeys.all });
    },
  });
  if (!proposal.canDecide) return null;
  const pending = decide.isPending ? decide.variables : undefined;
  const reject = (
    <Button
      variant='outline'
      disabled={decide.isPending}
      data-action='reject'
      onClick={() => decide.mutate({ decision: 'reject' })}
    >
      {pending?.decision === 'reject' ? (
        <Spinner data-icon='inline-start' />
      ) : (
        <XIcon data-icon='inline-start' />
      )}
      {t('knowledge.proposals.reject')}
    </Button>
  );
  // Sent back: it waits for its revision, or is given up on.
  if (proposal.status === 'revising')
    return (
      <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
        <p className='text-sm text-muted-foreground'>
          {t('knowledge.revisions.waiting', {
            name: proposal.proposer.name ?? t('knowledge.someone'),
          })}
        </p>
        <div className='flex shrink-0 gap-2'>{reject}</div>
      </div>
    );
  if (proposal.status !== 'pending') return null;
  return (
    <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
      <Input
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        placeholder={t('knowledge.proposals.comment')}
        aria-label={t('knowledge.proposals.comment')}
        maxLength={KNOWLEDGE_COMMENT_MAX}
        className='min-w-0 flex-1'
      />
      <div className='flex shrink-0 gap-2'>
        {reject}
        <Button
          variant='outline'
          disabled={decide.isPending}
          data-action='send-back'
          onClick={() => setSendingBack(true)}
        >
          <Undo2Icon data-icon='inline-start' />
          {t('knowledge.revisions.sendBack')}
        </Button>
        <Button
          disabled={decide.isPending}
          data-action={stale ? 'accept-anyway' : 'accept'}
          onClick={() =>
            decide.mutate({ decision: 'accept', confirmStale: stale })
          }
        >
          {pending?.decision === 'accept' ? (
            <Spinner data-icon='inline-start' />
          ) : (
            <CheckIcon data-icon='inline-start' />
          )}
          {t(
            stale
              ? 'knowledge.proposals.acceptAnyway'
              : 'knowledge.proposals.accept',
          )}
        </Button>
      </div>
      {sendingBack ? (
        <RequestChangesDialog
          open
          onOpenChange={setSendingBack}
          target={{ kind: 'proposal', proposal }}
          onSent={() => onDecided?.()}
        />
      ) : null}
    </div>
  );
}

/** The proposals of the view's spaces with one status, newest first, each opening its detail. */
export function ProposalList({
  status,
  onStatus,
  proposals,
  loading,
  about,
  onClearAbout,
  onOpen,
}: {
  readonly status: ProposalListStatus;
  readonly onStatus: (status: ProposalListStatus) => void;
  readonly proposals: readonly KnowledgeProposal[];
  readonly loading: boolean;
  /** The title of the document the list is narrowed to, or null. */
  readonly about: string | null;
  readonly onClearAbout: () => void;
  readonly onOpen: (id: string) => void;
}): ReactElement {
  const { t, i18n } = useTranslation(ACCESS_NAMESPACE);
  const proposer = useProposer();
  const sorted = proposals
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <section className='space-y-4' data-testid='knowledge-proposals'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <h2 className='font-heading text-xl font-semibold'>
          {t('knowledge.proposals.listTitle')}
        </h2>
        {about ? (
          <Badge variant='secondary' className='gap-1'>
            {t('knowledge.proposals.about', { title: about })}
            <button
              type='button'
              aria-label={t('knowledge.proposals.clearAbout')}
              onClick={onClearAbout}
            >
              <XIcon className='size-3' />
            </button>
          </Badge>
        ) : null}
      </div>
      <Tabs
        value={status}
        onValueChange={(next) => {
          const found = PROPOSAL_LIST_STATUSES.find((item) => item === next);
          if (found) onStatus(found);
        }}
      >
        <TabsList>
          {PROPOSAL_LIST_STATUSES.map((item) => (
            <TabsTrigger key={item} value={item}>
              {t(`knowledge.proposals.statuses.${item}`)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {loading ? (
        <Skeleton className='h-24 w-full' />
      ) : sorted.length === 0 ? (
        <Empty className='min-h-40 border border-dashed'>
          <EmptyHeader>
            <EmptyMedia variant='icon'>
              <CheckIcon />
            </EmptyMedia>
            <EmptyTitle>{t(`knowledge.proposals.none.${status}`)}</EmptyTitle>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className='divide-y rounded-lg border'>
          {sorted.map((item) => (
            <li key={item.id}>
              <button
                type='button'
                className='flex w-full min-w-0 flex-col gap-1 px-4 py-3 text-left hover:bg-muted sm:flex-row sm:items-center sm:gap-3'
                onClick={() => onOpen(item.id)}
              >
                <span className='flex min-w-0 flex-1 items-center gap-2 text-sm'>
                  <ProposalKindBadge proposal={item} />
                  <span className='truncate font-medium'>
                    {item.docTitle || item.title}
                  </span>
                  {item.stale && item.status === 'pending' ? (
                    <AlertTriangleIcon
                      className='size-3.5 shrink-0 text-muted-foreground'
                      aria-label={t('knowledge.proposals.staleTitle')}
                    />
                  ) : null}
                </span>
                <span className='shrink-0 text-xs text-muted-foreground'>
                  {proposer(item)} ·{' '}
                  {relativeTime(item.createdAt, i18n.language)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** One proposal in the view: back to the list, its document, its tabs, and the review bar pinned at the bottom. */
export function ProposalDetail({
  id,
  onBack,
  onDecided,
  onOpenDoc,
}: {
  readonly id: string;
  readonly onBack: () => void;
  readonly onDecided: () => void;
  readonly onOpenDoc: (docId: string) => void;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const proposal = useKnowledgeProposal(id);
  if (proposal.isError)
    return (
      <Empty className='min-h-40 border border-dashed'>
        <EmptyHeader>
          <EmptyDescription>{t('knowledge.doc.notFound')}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  if (!proposal.data) return <Skeleton className='h-40 w-full' />;
  const item = proposal.data;
  return (
    <article className='flex min-h-full min-w-0 flex-col gap-4'>
      <div>
        <Button variant='ghost' className='-ml-2' onClick={onBack}>
          <ArrowLeftIcon data-icon='inline-start' />
          {t('knowledge.proposals.listTitle')}
        </Button>
      </div>
      <header className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
        <h1 className='font-heading text-2xl font-semibold tracking-tight wrap-anywhere'>
          {item.docTitle || item.title}
        </h1>
        {item.docId ? (
          <Button variant='outline' onClick={() => onOpenDoc(item.docId!)}>
            <FileTextIcon data-icon='inline-start' />
            {t('knowledge.proposals.open')}
          </Button>
        ) : null}
      </header>
      <div className='flex-1'>
        <ProposalBody proposal={item} />
      </div>
      {item.status === 'pending' ||
      (item.status === 'revising' && item.canDecide) ? (
        <div className='sticky bottom-0 z-10 -mx-4 -mb-4 border-t bg-background/95 px-4 py-3 backdrop-blur-md md:-mx-6 md:-mb-6 md:px-6'>
          {item.canDecide ? (
            <ProposalActions proposal={item} onDecided={onDecided} />
          ) : (
            <p className='text-sm text-muted-foreground'>
              {t('knowledge.proposals.readOnly')}
            </p>
          )}
        </div>
      ) : null}
    </article>
  );
}
