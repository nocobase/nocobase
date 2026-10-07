import type { Executor } from '../../../shared/issues.js';
import type { EventActor } from '../issues/issue.events.js';

declare module '../../kernel/events.js' {
  interface DomainEventMap {
    /** Nothing holds the issue any more: what it waited for finished, was deleted, or stopped being a blocker. */
    'issue.dependencyReleased': {
      readonly issueId: string;
      readonly identifier: string;
      readonly title: string;
      readonly ownerUserId: string;
      readonly executor: Executor | null;
      /** The issue that held it; its revision tells a later release of the same blocker from this one. */
      readonly releasedBy: {
        readonly issueId: string;
        readonly identifier: string;
        readonly revision: number;
      };
      /** Who finished or removed the blocker. */
      readonly actor: EventActor;
    };
    /** Every live sub-issue of the parent (`all`), or every one of a stage, is finished. */
    'issue.batchDone': {
      readonly parentIssueId: string;
      readonly identifier: string;
      readonly title: string;
      readonly ownerUserId: string;
      readonly stage: number | null;
      readonly all: boolean;
      readonly childIssueIds: readonly string[];
      /** The sub-issue that finished the batch. */
      readonly finishedBy: {
        readonly issueId: string;
        readonly revision: number;
      };
      readonly actor: EventActor;
    };
  }
}

export {};
