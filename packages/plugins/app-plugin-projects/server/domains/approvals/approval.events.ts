declare module '../../kernel/events.js' {
  interface DomainEventMap {
    /** A status change waits for one of `approverUserIds`. */
    'approval.requested': {
      readonly requestId: string;
      readonly issueId: string;
      readonly identifier: string;
      readonly title: string;
      readonly fromStatus: string;
      readonly toStatus: string;
      readonly toStatusName: string;
      readonly approverUserIds: readonly string[];
    };
    /** A request was approved, rejected, withdrawn or went stale. */
    'approval.decided': {
      readonly requestId: string;
      readonly issueId: string;
      readonly identifier: string;
      readonly title: string;
      readonly status: 'approved' | 'rejected' | 'withdrawn' | 'stale';
      readonly toStatus: string;
      readonly toStatusName: string;
      readonly requestedBy: {
        readonly type: string;
        readonly id: string;
      };
      /** The issue's owner, told the outcome of a request another kind (an agent) made. */
      readonly ownerUserId: string | null;
      /** Who the request waited for. */
      readonly approverUserIds: readonly string[];
      readonly decidedById: string | null;
      /**
       * Why an approved request went stale instead of moving the issue (its conditions no longer hold), and who
       * approved it; null for a request that went stale because the issue left the status, and for other outcomes.
       */
      readonly staleReason: {
        readonly code: string;
        readonly message: string | null;
        readonly attemptedById: string | null;
      } | null;
      /** What the approver wrote, if anything. */
      readonly comment: string | null;
    };
  }
}

export {};
