/**
 * The star that adds an issue to "My follow-ups" or takes it off (`POST /api/followUps/issues/:issueId/follow` or
 * `/unfollow`), reading only what the viewer follows (`GET /api/followUps/following`). Only at the stored bound, which
 * nobody meets in use, is an unfollowed issue's star held, with the reason as its hint.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { StarIcon } from 'lucide-react';
import type { ReactElement } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from 'cn';

import { FOLLOW_UPS_MAX } from '../../../shared/follow-ups.js';
import { useNotify } from '../../access/notify.js';
import { useFollowIssue, useFollowing } from '../../follow-ups/api.js';

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
  defaults = false,
  className,
  ...props
}: {
  readonly issueId: string;
  /**
   * Counts "My follow-ups"' default list (the viewer's blocked and in-review issues) as followed until they choose, as
   * that page shows it; elsewhere only what they chose is followed.
   */
  readonly defaults?: boolean;
  /** What the viewer chose to follow, where the page has read it already (the task lists'); read here otherwise. */
  readonly following?: readonly string[] | undefined;
  readonly className?: string;
}): ReactElement {
  const { t } = useTranslation();
  const notify = useNotify();
  const known = defaults ? undefined : props.following;
  const read = useFollowing(known === undefined);
  const followIssue = useFollowIssue((error) =>
    notify.error(error, t('issueLive.follow.saveFailed')),
  );
  const listed =
    known ??
    (read.data && (defaults || read.data.stored) ? read.data.issueIds : []);
  // The list's copy is read back once the change is saved; until then the star shows the change it is making.
  const pending = followIssue.isPending ? followIssue.variables : undefined;
  const following =
    known !== undefined && pending?.issueId === issueId
      ? pending.follow
        ? [...listed.filter((id) => id !== issueId), issueId]
        : listed.filter((id) => id !== issueId)
      : listed;
  const max = read.data?.max ?? FOLLOW_UPS_MAX;
  const { followed, full } = followState(following, issueId, max);
  const loading = known === undefined && !read.data;
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
          ? t('issueLive.follow.fullHint', { max })
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
      {/* On a phone the star alone. */}
      <span className='max-md:sr-only'>
        {followed
          ? t('issueLive.follow.following')
          : full
            ? t('issueLive.follow.full', { max })
            : t('issueLive.follow.follow')}
      </span>
    </Button>
  );
}
