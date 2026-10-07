declare module '../../kernel/events.js' {
  interface DomainEventMap {
    /** A label was renamed, recolored or deleted: every issue carrying it looks different now. */
    'label.changed': { readonly labelId: string };
  }
}

export {};
