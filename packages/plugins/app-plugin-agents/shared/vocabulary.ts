/**
 * What the application calls the things agents work with, for the browser: the subjects runs work on, the scopes
 * variables and default skills are kept in, and the places conversations are started from. Each is contributed on the server by whoever owns it (the application, or
 * this plugin for its own `conversation` subject) and read in one request, so the pages need no configuration of their
 * own.
 *
 * `GET agents/vocabulary` (anyone signed in: labels only) answers `{ data: AgentsVocabulary }`.
 */
import type { I18nText } from './i18n.js';

export const VOCABULARY_ROUTE = 'agents/vocabulary';

/** A kind of subject runs work on. */
export interface SubjectVocabulary {
  readonly kind: string;
  /** What a person calls one (a ticket, a conversation); null: shown by its kind. */
  readonly title: I18nText | null;
  /** What a person calls the group one belongs to (a project); null: the usage page says "group". */
  readonly groupTitle: I18nText | null;
  /** Where the application shows one and its group, `{id}` standing for the id; null: nowhere to link. */
  readonly path: string | null;
  readonly groupPath: string | null;
  /** The reasons a run on it starts (`input.payload.trigger`), as the run panel names them. */
  readonly triggers: Readonly<Record<string, I18nText>>;
  /** Offered as a scenario of "Preview full prompt", rendered on a made-up subject of the kind. */
  readonly preview: boolean;
}

/** A scope of variables and default skills besides an agent's own. */
export interface ScopeVocabulary {
  readonly key: string;
  readonly title: I18nText;
  readonly description: I18nText | null;
}

/** A place conversations are started from besides the chat panel. */
export interface SourceVocabulary {
  readonly key: string;
  readonly title: I18nText;
}

export interface AgentsVocabulary {
  readonly subjects: readonly SubjectVocabulary[];
  /** The conversation sources the application registered (the panel's own, `panel`, is not listed). */
  readonly sources: readonly SourceVocabulary[];
  /** In merge order: the ones a subject names first, then `workdir`. `agent` is never listed. */
  readonly scopes: readonly ScopeVocabulary[];
}
