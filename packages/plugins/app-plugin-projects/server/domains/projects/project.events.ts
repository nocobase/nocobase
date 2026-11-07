declare module '../../kernel/events.js' {
  interface DomainEventMap {
    /** A project and its initial members have been created in this transaction. */
    'project.created': {
      readonly projectId: string;
      /** The person who created it; null when a service account, such as an organization's API key, did. */
      readonly creatorUserId: string | null;
    };
  }
}
export {};
