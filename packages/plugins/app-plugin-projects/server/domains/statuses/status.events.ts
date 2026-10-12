declare module '../../kernel/events.js' {
  interface DomainEventMap {
    /** An issue entered a status whose owner is told (`blocked`, `in_review`), moved by someone else. */
    'status.ownerNotified': {
      readonly issueId: string;
      readonly identifier: string;
      readonly title: string;
      readonly ownerUserId: string;
      readonly statusKey: string;
      readonly statusName: string;
    };
  }
}

export {};
