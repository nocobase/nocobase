declare module '../../kernel/events.js' {
  interface DomainEventMap {
    /** A project and its initial members have been created in this transaction. */
    'project.created': {
      readonly projectId: string;
      /** The person who created it; null when a service account, such as an organization's API key, did. */
      readonly creatorUserId: string | null;
    };
    /**
     * Who may see the project's issues may have changed: a member joined or left, or its visibility or lead changed.
     * Its issues' events do not say so, so a listener that keeps per-person state about them reads them again.
     */
    'project.changed': { readonly projectId: string };
  }
}
export {};
