declare module '../../kernel/events.js' {
  interface DomainEventMap {
    /** A project and its initial members have been created in this transaction. */
    'project.created': { readonly projectId: string };
  }
}
export {};
