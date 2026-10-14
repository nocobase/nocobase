/**
 * The star that adds an issue to "My follow-ups" or takes it off (`POST /api/followUps/issues/:issueId/follow` or
 * `/unfollow`). It says how many of
 * the allowed issues are followed; once that many are, an unfollowed issue's star is held, with the reason as its hint.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { StarIcon } from 'lucide-react';
import type { ReactElement } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from 'cn';

import { FOLLOW_UPS_MAX } from '../../../shared/follow-ups.js';
import { useNotify } from '../../access/notify.js';
import { useFollowIssue, useFollowUps } from '../../follow-ups/api.js';

/** What the star shows: followed, or held because the list is full. */
function followState(
  following: readonly string[],
  issueId: string,
  max: number = FOLLOW_UPS_MAX,
): { readonly followed: boolean; readonly full: boolean } {
  const followed = following.includes(issueId);
  return { followed, full: !followed && following.length >= max };
}

export function FollowToggle({
  issueId,
  className,
}: {
  readonly issueId: string;
  readonly className?: string;
}): ReactElement {
  const { t } = useTranslation();
  const notify = useNotify();
  const overview = useFollowUps();
  const followIssue = useFollowIssue((error) =>
    notify.error(error, t('issueLive.follow.saveFailed')),
  );
  const following = overview.data?.following ?? [];
  const { followed, full } = followState(following, issueId);
  const loading = !overview.data;
  const held = full || loading;
  return (
    <Button
      size='sm'
      variant='outline'
      aria-pressed={followed}
      aria-disabled={held || undefined}
      className={cn(
        'aria-disabled:cursor-not-allowed aria-disabled:opacity-60',
        className,
      )}
      title={
        full
          ? t('issueLive.follow.fullHint', { max: FOLLOW_UPS_MAX })
          : followed
            ? t('issueLive.follow.unfollow')
            : undefined
      }
      data-testid='follow-toggle'
      onClick={
        held
          ? undefined
          : () => followIssue.mutate({ issueId, follow: !followed })
      }
    >
      <StarIcon
        data-icon='inline-start'
        className={cn(followed && 'fill-amber-400 text-amber-500')}
      />
      {/* On a phone the star alone, with the count when followed. */}
      <span className='max-md:sr-only'>
        {followed
          ? t('issueLive.follow.following', {
              count: following.length,
              max: FOLLOW_UPS_MAX,
            })
          : full
            ? t('issueLive.follow.full', { max: FOLLOW_UPS_MAX })
            : t('issueLive.follow.follow')}
      </span>
      {followed ? (
        <span aria-hidden className='tabular-nums md:hidden'>
          {following.length}/{FOLLOW_UPS_MAX}
        </span>
      ) : null}
    </Button>
  );
}
