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
    }
  | undefined
>;

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
