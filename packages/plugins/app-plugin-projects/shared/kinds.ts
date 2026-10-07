/**
 * Kinds of principal that act on issues or are named in them: `user` (people) and `system` (the plugin's own rules)
 * are built in; other plugins register more (`projectsKindsToken`), such as an agent runtime registering `agent`.
 * Executors, activity, mentions, approval requesters and workflow transitions all name a kind by its key.
 */

export const USER_KIND = 'user';
export const SYSTEM_KIND = 'system';
export const BUILTIN_KINDS: readonly string[] = [USER_KIND, SYSTEM_KIND];

/** Plain text, or an i18n key in a namespace. */
export type KindTitle = string | { readonly key: string; readonly ns: string };

/** A kind as the browser sees it (`GET /api/projects/me`). Built-in kinds are titled by the client's own locale. */
export interface KindInfo {
  readonly key: string;
  readonly title: KindTitle | null;
  /** It may be an issue's executor. */
  readonly executor: boolean;
  /** It may be mentioned in Markdown text (`mention://<key>/<id>`). */
  readonly mentionable: boolean;
}

/** A name as an i18n key in a namespace, shown in the viewer's language with `name` as its fallback. */
export interface NameText {
  readonly key: string;
  readonly ns: string;
}

/** An executor of another kind the signed-in user may choose (`GET /api/projects/executors`). */
export interface ExecutorCandidate {
  /** Its kind's key. */
  readonly type: string;
  readonly id: string;
  readonly name: string;
  /** Its name in the viewer's language, when its kind ships one (a built-in agent). */
  readonly nameText?: NameText;
  /** Something can run its work now (for an agent: a fitting runner is online); unknown when left out. */
  readonly online?: boolean;
  /** Work it is doing or has queued. */
  readonly busy?: number;
}
