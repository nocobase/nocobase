/**
 * The issue page's design proposal (main column, `pages/issues/detail`): the newest proposal, and the decision while the issue waits in Proposal review, at `#design`.
 * Nothing shows on an issue without a proposal.
 */
import type { IssueDetail } from '@nocobase/app-plugin-projects/shared/issues';
import { useEffect, useRef, type ReactElement } from 'react';
import { useLocation } from 'react-router';

import { DESIGN_SECTION_ANCHOR } from '../../../shared/design.js';
import { useDesignState } from './api.js';
import { DesignProposalView } from './proposal-view.js';

export function DesignSection({
  issue,
}: {
  readonly issue: IssueDetail;
}): ReactElement | null {
  const state = useDesignState(issue.id, issue.revision);
  const location = useLocation();
  const ref = useRef<HTMLDivElement>(null);
  const shown = Boolean(state.data?.proposal);
  // `#design` (the Agent queue's "Handle" link) scrolls to the proposal once it is shown.
  useEffect(() => {
    if (shown && location.hash === `#${DESIGN_SECTION_ANCHOR}`)
      ref.current?.scrollIntoView?.({ block: 'start' });
  }, [shown, location.hash]);
  if (!state.data?.proposal) return null;
  return (
    <div id={DESIGN_SECTION_ANCHOR} ref={ref} className='scroll-mt-4'>
      <DesignProposalView
        issueId={issue.id}
        identifier={issue.identifier}
        state={state.data}
        collapsible={!state.data.inReview}
      />
    </div>
  );
}
