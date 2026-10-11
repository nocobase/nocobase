/**
 * An issue's design proposal (`shared/design.ts`): the document in full, who submitted
 * it and when, and — while the issue waits in Proposal review — "Approve for development" and "Send back" (with the
 * comment it needs) for whoever may decide. The issue page's section and the owner's inbox card both show it.
 */
import { AgentAvatar } from '@nocobase/app-plugin-agents/client/kit';
import { PmTag } from '@nocobase/app-plugin-projects/client/kit';
import { useTranslation } from '@nocobase/i18n/client';
import { BotIcon, ChevronDownIcon, CogIcon, CompassIcon } from 'lucide-react';
import { useRef, useState, type ReactElement } from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from 'cn';

import type { DesignState } from '../../../shared/design.js';
import { useNotify } from '../../access/notify.js';
import { relativeTime } from '@/extensions/nocobase-inbox/model';
import { KnowledgeMarkdown } from '@nocobase/app-plugin-knowledge/client/pages';
import { DecisionActionsBar } from '@/extensions/nocobase-inbox/decision-actions-bar';
import { useDesignApproval } from './approval.js';
import { useDesignDecision } from './api.js';

export function DesignProposalView({
  issueId,
  identifier,
  state,
  loading = false,
  collapsible = false,
  onDecided,
}: {
  readonly issueId: string;
  readonly identifier: string;
  readonly state: DesignState | undefined;
  readonly loading?: boolean;
  /** Folds a long document until it is expanded (the issue page). */
  readonly collapsible?: boolean;
  readonly onDecided?: () => void;
}): ReactElement | null {
  const { t, i18n } = useTranslation();
  const notify = useNotify();
  const decide = useDesignDecision(issueId);
  const headingRef = useRef<HTMLSpanElement>(null);
  const approval = useDesignApproval(
    issueId,
    state,
    () => {
      notify.success(t('design.done.approve'));
      onDecided?.();
    },
    () => headingRef.current,
  );
  const [expanded, setExpanded] = useState(!collapsible);
  if (!state) return loading ? <Skeleton className='h-32 w-full' /> : null;
  const { proposal } = state;
  if (!proposal) return null;
  const shown = approval.latest ?? state;
  const canAct = shown.canApprove || shown.canRequestChanges;
  return (
    <article
      className='space-y-3 rounded-lg border border-l-2 border-l-primary/60 bg-card p-4 text-card-foreground'
      aria-label={t('design.title')}
      data-testid='design-proposal'
    >
      <header className='flex flex-wrap items-center gap-2 text-sm'>
        <CompassIcon
          className='size-4 text-muted-foreground'
          aria-hidden='true'
        />
        <span ref={headingRef} tabIndex={-1} className='font-medium'>
          {t('design.title')}
        </span>
        {state.inReview ? (
          <PmTag tone='amber' dot>
            {t('design.waiting')}
          </PmTag>
        ) : null}
        <span className='ml-auto inline-flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground'>
          {proposal.authorType === 'user' ? null : proposal.authorType ===
            'agent' ? (
            <AgentAvatar name={proposal.authorName} size='sm' />
          ) : (
            <Avatar
              size='sm'
              aria-hidden='true'
              className='size-6 rounded-md after:rounded-md'
            >
              <AvatarFallback className='rounded-md'>
                {proposal.authorType === 'system' ? (
                  <CogIcon className='size-3.5' />
                ) : (
                  <BotIcon className='size-3.5' />
                )}
              </AvatarFallback>
            </Avatar>
          )}
          <span className='truncate'>
            {t('design.by', {
              name: proposal.authorName ?? t('inbox.someone'),
              time: relativeTime(proposal.createdAt, i18n.language),
            })}
          </span>
        </span>
      </header>
      <div
        className={cn(
          'relative text-sm',
          !expanded && 'max-h-64 overflow-hidden',
        )}
      >
        <KnowledgeMarkdown content={proposal.content} />
        {!expanded ? (
          <div className='pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card' />
        ) : null}
      </div>
      {collapsible ? (
        <Button
          variant='ghost'
          size='sm'
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          <ChevronDownIcon
            data-icon='inline-start'
            className={cn('transition-transform', expanded && 'rotate-180')}
          />
          {expanded ? t('design.collapse') : t('design.expand')}
        </Button>
      ) : null}
      {approval.dialog}
      {canAct ? (
        <DecisionActionsBar
          allowed={{
            approve: shown.canApprove,
            reject: shown.canRequestChanges,
          }}
          itemTitle={t('design.cardTitle', { identifier })}
          labels={{
            approve: t('design.approve'),
            reject: t('design.requestChanges'),
          }}
          pending={
            approval.pending
              ? 'approve'
              : decide.isPending
                ? decide.variables.decision === 'approve'
                  ? 'approve'
                  : 'reject'
                : null
          }
          disabled={decide.isPending || approval.pending}
          onRun={(decision, comment) => {
            if (decision === 'approve') {
              approval.approve(comment);
              return;
            }
            decide.mutate(
              {
                decision: 'requestChanges',
                comment,
              },
              {
                onSuccess: () => {
                  notify.success(t('design.done.requestChanges'));
                  onDecided?.();
                },
                onError: (error) => notify.error(error),
              },
            );
          }}
        />
      ) : null}
    </article>
  );
}
