import type { Permissions } from './access.js';
import type { KindInfo } from './kinds.js';

/** An account that may take part: every active user of the application. */
export interface Member {
  readonly userId: string;
  readonly name: string;
  readonly email: string | null;
}

/**
 * An organization's API key, by the hidden identity (a service account) it acts as. It is not a member and is never
 * offered in a picker, but what it did is shown under the key's name with an "API key" tag
 * (`GET /api/projects/apiKeyActors`).
 */
export interface ApiKeyActor {
  readonly id: string;
  readonly name: string;
  readonly disabled: boolean;
}

/** `GET /api/projects/me`: the signed-in user and what they may do. */
export interface Me {
  readonly userId: string;
  readonly name: string;
  readonly permissions: Permissions;
  /** The kinds of principal the plugin knows, built-in ones first (`shared/kinds.ts`). */
  readonly kinds: readonly KindInfo[];
}
