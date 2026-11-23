/**
 * What a plugin declares for credentials such as API keys, next to the actions it registers: templates that start a
 * credential's permissions, and the records a business offers when a credential is limited to some of them. Which
 * actions no credential may hold is declared on the action itself (`ResourceActionMetadata.humanOnly`).
 */
import type { AuthorizationTitle } from './titles.js';
import type { AuthorizationIdentity, ResourceRef } from './types.js';

/** One resource of a template, with action names without their level (`deploy`, not `deploy.all`). */
export interface CredentialTemplateGrant {
  readonly resource: ResourceRef;
  /**
   * The actions, by name. A name also stands for every leveled action of it (`deploy` for `deploy.related` and
   * `deploy.all`); whoever applies the template keeps the ones they hold.
   */
  readonly actions: readonly string[];
  /** `pick`: the credential is limited to records chosen when it is made, from the business's object source. */
  readonly objects?: 'all' | 'pick';
}

/** A starting point for a credential's permissions, such as "CI deploy". */
export interface CredentialTemplate {
  /** `<plugin>.<name>`, such as `releases.ci-deploy`. */
  readonly id: string;
  readonly title: AuthorizationTitle;
  readonly description?: AuthorizationTitle;
  /** The expiry the template suggests, in days; null for none. */
  readonly expiresInDays?: number | null;
  readonly grants: readonly CredentialTemplateGrant[];
}

/** A record a credential may be limited to. */
export interface CredentialObject {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
}

/** Lists the records of a business a credential may be limited to: only those `identity` may see. */
export interface CredentialObjectSource {
  list(input: {
    readonly identity: AuthorizationIdentity;
    readonly search?: string;
    readonly ids?: readonly string[];
  }): Promise<readonly CredentialObject[]>;
}

/** `authz.credentials`. */
export class CredentialCatalog {
  private readonly templateEntries = new Map<string, CredentialTemplate>();
  private readonly sources = new Map<string, CredentialObjectSource>();

  readonly templates = {
    /** Registers a template; returns its removal. */
    add: (template: CredentialTemplate): (() => void) => {
      if (!template.id)
        throw new TypeError('A credential template needs an id');
      if (this.templateEntries.has(template.id))
        throw new Error(
          `Credential template already registered: ${template.id}`,
        );
      if (template.grants.some((grant) => grant.actions.length === 0))
        throw new TypeError(
          `Credential template ${template.id} lists a resource without actions`,
        );
      const entry = structuredClone(template);
      this.templateEntries.set(template.id, entry);
      return () => {
        if (this.templateEntries.get(template.id) === entry)
          this.templateEntries.delete(template.id);
      };
    },
    get: (id: string): CredentialTemplate | undefined =>
      this.templateEntries.get(id),
    list: (): readonly CredentialTemplate[] => [
      ...this.templateEntries.values(),
    ],
  };

  readonly objectSources = {
    /**
     * Registers where the records of `business` (the id `KeyScope.objects` takes, which is also the resource id of
     * its grants, such as `rel.apps`) come from. Only a business whose guards apply `KeyScope.objects` may offer one.
     */
    add: (business: string, source: CredentialObjectSource): (() => void) => {
      if (this.sources.has(business))
        throw new Error(
          `Credential object source already registered: ${business}`,
        );
      this.sources.set(business, source);
      return () => {
        if (this.sources.get(business) === source)
          this.sources.delete(business);
      };
    },
    get: (business: string): CredentialObjectSource | undefined =>
      this.sources.get(business),
    list: (): readonly string[] => [...this.sources.keys()].sort(),
  };
}
