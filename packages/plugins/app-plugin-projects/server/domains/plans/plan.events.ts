declare module '../../kernel/events.js' {
  interface DomainEventMap {
    /** A plan was created, rehearsed again, executed, voided, expired or undone; open cards refetch it. */
    'plan.changed': { readonly planId: string };
  }
}

export {};
