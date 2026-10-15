/**
 * The comment drafts of the tasks a person opens in the split view and the task panels, one per task, kept for the
 * life of the page so switching tasks never loses what they were writing. Only the text and the mode are kept; files
 * being added and the comment being answered belong to the open task.
 */
import { ComposerSession } from '@/components/composer-session';

/** How many drafts are kept; the least recently opened go first. */
const DRAFTS_MAX = 50;

const drafts = new Map<string, ComposerSession>();

export function taskDraft(issueId: string): ComposerSession {
  let session = drafts.get(issueId);
  if (session) drafts.delete(issueId);
  else session = new ComposerSession();
  drafts.set(issueId, session);
  while (drafts.size > DRAFTS_MAX) {
    const oldest = drafts.keys().next().value;
    if (oldest === undefined) break;
    drafts.delete(oldest);
  }
  return session;
}
