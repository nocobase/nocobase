import type {
  CommentReaction,
  ReactionEmoji,
} from '../../../../shared/comments.js';

/**
 * Comment reactions, ported from the old NocoProject's `client/pages/np/issues/detail/reaction-model.ts`: each person
 * toggles their own emoji from the fixed set.
 */

export function hasReacted(
  reactions: readonly CommentReaction[],
  emoji: string,
  userId: string | null | undefined,
): boolean {
  if (!userId) return false;
  return reactions.some(
    (reaction) => reaction.emoji === emoji && reaction.userIds.includes(userId),
  );
}

/** The reactions after `userId` toggles `emoji`: added with count + 1, or removed (and dropped at zero). */
export function toggleReaction(
  reactions: readonly CommentReaction[],
  emoji: ReactionEmoji,
  userId: string,
): CommentReaction[] {
  const list = [...reactions];
  const index = list.findIndex((reaction) => reaction.emoji === emoji);
  if (index < 0) return [...list, { emoji, count: 1, userIds: [userId] }];
  const current = list[index];
  if (current.userIds.includes(userId)) {
    const userIds = current.userIds.filter((id) => id !== userId);
    if (userIds.length === 0) return list.filter((_, at) => at !== index);
    list[index] = { emoji, count: Math.max(current.count - 1, 0), userIds };
    return list;
  }
  list[index] = {
    emoji,
    count: current.count + 1,
    userIds: [...current.userIds, userId],
  };
  return list;
}

/** Reactions with at least one person, in the order of the emoji set, unknown emoji last. */
export function visibleReactions(
  reactions: readonly CommentReaction[],
  order: readonly string[],
): CommentReaction[] {
  const rank = (emoji: string): number => {
    const index = order.indexOf(emoji);
    return index < 0 ? order.length : index;
  };
  return reactions
    .filter((reaction) => reaction.count > 0)
    .sort((a, b) => rank(a.emoji) - rank(b.emoji));
}
