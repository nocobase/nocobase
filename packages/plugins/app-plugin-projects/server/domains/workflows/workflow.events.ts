import type { RuleMessage } from '../../../shared/workflows.js';

declare module '../../kernel/events.js' {
  interface DomainEventMap {
    /**
     * A workflow changed, was created, deleted or made the default, or a project switched to it (null: the default):
     * the statuses and moves of its issues may be different now.
     */
    'workflow.changed': { readonly workflowId: string | null };
    /** An issue entered a status whose workflow tells its owner (`notifyOwner`). */
    'workflow.ownerNotified': {
      readonly issueId: string;
      readonly identifier: string;
      readonly title: string;
      readonly ownerUserId: string;
      readonly statusKey: string;
      /** As the workflow names it; a built-in status with its default name is translated instead. */
      readonly statusName: string;
      /** Plain text, or a key the reader's side translates (`LocalizedMessage`). */
      readonly message: RuleMessage | null;
    };
  }
}

export {};
