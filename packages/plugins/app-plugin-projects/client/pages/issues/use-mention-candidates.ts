import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { MENTION_CANDIDATE_LIMIT } from '../../../shared/comments.js';
import { USER_KIND } from '../../../shared/kinds.js';
import { pmKeys } from '../../api/keys.js';
import type { PmMentionCandidate } from '../../components/pm-rich-text-editor.js';
import { usePmApi } from '../../hooks/use-pm-api.js';
import { useKinds } from '../../lib/kinds.js';
import { usePrincipalName } from '../../lib/principal-name.js';

/**
 * Who the `@` list offers: the members, and when another plugin registers a mentionable kind, that kind's candidates
 * from `GET /api/projects/mentionCandidates` (for `issueId`, which may narrow them), listed first. The editor filters by name.
 */
export function useMentionCandidates(
  enabled = true,
  issueId: string | null = null,
): PmMentionCandidate[] {
  const api = usePmApi();
  const nameOf = usePrincipalName();
  const others = useHasMentionableKinds();
  const members = useQuery({
    queryKey: pmKeys.members,
    queryFn: () => api.members(),
    enabled,
  });
  const registered = useQuery({
    queryKey: pmKeys.mentions(issueId),
    queryFn: () =>
      api.mentionCandidates({
        ...(issueId ? { issueId } : {}),
        limit: MENTION_CANDIDATE_LIMIT.max,
      }),
    enabled: enabled && others,
  });
  return useMemo(
    () => [
      ...(registered.data ?? [])
        .filter((candidate) => candidate.kind !== USER_KIND)
        .map(({ nameText, ...candidate }) => ({
          ...candidate,
          name: nameOf({ name: candidate.name, nameText }),
        })),
      ...(members.data ?? []).map((member) => ({
        kind: USER_KIND,
        id: member.userId,
        name: member.name,
      })),
    ],
    [members.data, registered.data, nameOf],
  );
}

/** Another plugin registered a kind that may be mentioned, such as agents a comment can wake. */
export function useHasMentionableKinds(): boolean {
  return useKinds().some((kind) => kind.mentionable && kind.key !== USER_KIND);
}
