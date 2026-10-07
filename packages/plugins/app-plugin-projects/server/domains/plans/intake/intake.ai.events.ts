declare module '../../../kernel/events.js' {
  interface DomainEventMap {
    /** An intake request to AI started, progressed or ended; the page that waits for it reads it again. */
    'intake.changed': { readonly jobId: string };
  }
}

export {};
