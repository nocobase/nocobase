/** Workspace settings (`GET` / `PATCH /api/projects/settings`). */
export interface WorkspaceSettings {
  /** The prefix of new issue identifiers (`PM-12`); existing identifiers keep theirs. */
  readonly issuePrefix: string;
}

export type UpdateSettingsRequest = Partial<WorkspaceSettings>;

/** Upper-case letters and digits, starting with a letter. */
export const ISSUE_PREFIX_PATTERN: RegExp = /^[A-Z][A-Z0-9]{0,9}$/u;
