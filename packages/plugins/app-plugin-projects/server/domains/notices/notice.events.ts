import type { PlannedNotice } from './ports.js';

declare module '../../kernel/events.js' {
  interface DomainEventMap {
    /** A notice to send once the transaction commits. */
    'notice.planned': { readonly notice: PlannedNotice };
  }
}

export {};
