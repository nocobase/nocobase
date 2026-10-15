/**
 * An issue tied to a session, opened beside the conversation on "My Agent" (the agent sessions plugin's `linkPanels`):
 * the same task detail as the split view (`issues/groups/detail-pane.tsx`), its comment box folded to one line since
 * the page already talks to the agent, and on a phone in a sheet whose bottom is the task's action bar. The section shown
 * stays as the person moves between the session's tasks.
 */
import type { LinkPanelProps } from '@nocobase/app-plugin-agent-sessions/client';
import { useViewer } from '@nocobase/app-plugin-projects/client/kit';
import type { IssueDetail } from '@nocobase/app-plugin-projects/shared/issues';
import { useState, type ReactElement } from 'react';

import type { WaitReason } from '../../shared/task-groups.js';
import type { DetailTab } from '../issues/groups/detail-model.js';
import { TaskDetailPane } from '../issues/groups/detail-pane.js';
import { ActionBar } from '../issues/groups/phone-list.js';

let lastTab: DetailTab = 'feed';

/** What the task waits on the viewer for, by its status alone, as the session's list says it. */
function waitOf(
  detail: IssueDetail,
  viewerId: string | undefined,
): WaitReason[] {
  if (!viewerId || detail.ownerUserId !== viewerId) return [];
  if (detail.statusKey === 'in_review') return ['accept'];
  if (detail.statusKey === 'blocked' && detail.blockedCount === 0)
    return ['answer'];
  return [];
}

export default function SessionTaskPanel({
  link,
  index,
  total,
  onPrevious,
  onNext,
  onClose,
  leading,
  variant,
}: LinkPanelProps): ReactElement {
  const viewer = useViewer();
  const [tab, setTab] = useState<DetailTab>(lastTab);
  const sheet = variant === 'sheet';
  return (
    <TaskDetailPane
      issueId={link.refId}
      variant={sheet ? 'phone' : 'agent'}
      issuePath={`/issues/${encodeURIComponent(link.key ?? link.refId)}`}
      tab={tab}
      onTabChange={(next) => {
        lastTab = next;
        setTab(next);
      }}
      leading={leading}
      onClose={onClose}
      nav={{ index, total, onPrevious, onNext }}
      {...(sheet
        ? {
            footer: (detail: IssueDetail, update) => (
              <ActionBar
                item={{ waits: waitOf(detail, viewer?.userId) }}
                detail={detail}
                update={update}
                onTab={setTab}
              />
            ),
          }
        : {})}
      className='min-h-0 flex-1'
    />
  );
}
