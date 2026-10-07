declare module '../../kernel/events.js' {
  interface DomainEventMap {
    /** Someone followed or stopped following an issue by hand. */
    'subscription.changed': {
      readonly issueId: string;
      readonly userId: string;
      readonly subscribed: boolean;
    };
  }
}

export {};
