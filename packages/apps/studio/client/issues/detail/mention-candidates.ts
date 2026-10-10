import type { RichTextMention } from '@/components/rich-text-editor';

import type { MentionCandidate } from '@nocobase/app-plugin-projects/client/issues';
import type { UserRef } from '@nocobase/app-plugin-projects/shared/common';

/** Keep other registered mention kinds, but offer people only when they belong to this project's member list. */
export function issueMentionCandidates(
  query: string,
  candidates: readonly MentionCandidate[],
  members: readonly UserRef[],
  kindLabel: (kind: string) => string,
): RichTextMention[] {
  const needle = query.toLocaleLowerCase();
  return [
    ...candidates
      .filter(
        (candidate) =>
          candidate.kind !== 'user' &&
          candidate.name.toLocaleLowerCase().includes(needle),
      )
      .map((candidate) => ({
        ...candidate,
        kindLabel: kindLabel(candidate.kind),
      })),
    ...members
      .filter((member) => member.name.toLocaleLowerCase().includes(needle))
      .map((member) => ({
        kind: 'user',
        id: member.id,
        name: member.name,
        kindLabel: kindLabel('user'),
      })),
  ];
}
