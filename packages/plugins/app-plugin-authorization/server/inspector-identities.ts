import type {
  AuthorizationIdentity,
  AuthorizationSubject,
} from '@nocobase/authorization/core';

/**
 * A kind of subject the permission inspector checks besides a user, such as an API key: what it resolves to is the
 * identity a request made with it carries (its holder, with the credential's scope), and the subject whose roles it
 * holds. Undefined when there is no such subject.
 */
export type InspectorIdentityResolver = (id: string) => Promise<
  | {
      readonly identity: AuthorizationIdentity;
      /** Whose roles the identity holds, such as the key's person or service account. */
      readonly holder: AuthorizationSubject;
      /** For a credential, such as an API key: whether it can be used now, and the records it is limited to. */
      readonly credential?: InspectedCredential;
    }
  | undefined
>;

/** What the inspector shows of a credential besides its scope, which the identity's `keyScope` carries. */
export interface InspectedCredential {
  /** A credential that is disabled or expired allows nothing, whatever its scope says. */
  readonly state: 'active' | 'disabled' | 'expired';
  readonly expiresAt?: string | null;
  /** The records a business is limited to, by business; a business left out is not limited. */
  readonly objects?: Readonly<Record<string, readonly string[]>>;
}

/** `authz.inspector`: kinds of subject the permission inspector checks besides users. */
export interface InspectorApi {
  readonly identities: {
    /** Adds a kind of subject by its type; returns what removes it. */
    add(type: string, resolve: InspectorIdentityResolver): () => void;
    get(type: string): InspectorIdentityResolver | undefined;
  };
}

export function createInspectorApi(): InspectorApi {
  const resolvers = new Map<string, InspectorIdentityResolver>();
  return {
    identities: {
      add(type, resolve) {
        if (resolvers.has(type))
          throw new Error(
            `Inspector subjects of type ${type} are already added.`,
          );
        resolvers.set(type, resolve);
        return () => {
          if (resolvers.get(type) === resolve) resolvers.delete(type);
        };
      },
      get: (type) => resolvers.get(type),
    },
  };
}
