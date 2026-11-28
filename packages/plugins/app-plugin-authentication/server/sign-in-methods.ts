import type { SignInMethodText } from '../shared/settings.js';

/** What a sign-in method reports about itself, read each time the settings page asks. */
export interface SignInMethodState {
  readonly status: 'enabled' | 'notConfigured';
  /** The configuration path that turns it on, such as `auth.plugins`; the page shows where its value comes from. */
  readonly configPath?: string;
}

/**
 * A way to sign in or to call the API that another plugin adds to the Authentication settings page.
 * Its `describe()` must return no secret: it only says whether the method is on and where that comes from.
 */
export interface SignInMethodDefinition {
  /** Unique across the application, such as `api-key`. */
  readonly id: string;
  readonly title: SignInMethodText;
  readonly description?: SignInMethodText;
  /** The configuration that turns it on, as code or a configuration path, such as `apiKey()`. */
  readonly config?: string;
  /** Whether the method adds an entry to the sign-in page. */
  readonly signInEntry?: boolean;
  /** An application path where the method is managed, such as `/me/api-keys`. */
  readonly detailsPath?: string;
  describe(): SignInMethodState;
}

/** The registry behind `signInMethodsToken`: other plugins add their sign-in methods to it at boot. */
export interface SignInMethodRegistry {
  /** Adds a method and returns a function that removes it. A second method with the same id is refused. */
  add(method: SignInMethodDefinition): () => void;
  list(): readonly SignInMethodDefinition[];
}

export function createSignInMethodRegistry(): SignInMethodRegistry {
  const methods = new Map<string, SignInMethodDefinition>();
  return {
    add(method) {
      if (methods.has(method.id))
        throw new Error(`Sign-in method "${method.id}" is already registered.`);
      methods.set(method.id, method);
      return () => {
        if (methods.get(method.id) === method) methods.delete(method.id);
      };
    },
    list() {
      return [...methods.values()];
    },
  };
}
