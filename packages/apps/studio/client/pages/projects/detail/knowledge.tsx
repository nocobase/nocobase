import { KnowledgeView } from '@nocobase/app-plugin-knowledge/client/pages';
import type { ReactElement } from 'react';
import { Outlet } from 'react-router';

import { projectSpace } from '../../../../shared/knowledge.js';
import { useRefreshInbox } from '../../../knowledge/inbox-refresh.js';
import { useKnowledgeAccessDetails } from '../../../knowledge/access.js';
import { useKnowledgeLabels } from '../../../knowledge/labels.js';
import { useProjectPage } from '../../../projects/detail/context.js';

/**
 * Tab `/projects/:projectId/knowledge`: the project's knowledge with the system's it inherits, in the knowledge
 * plugin's view, without a title of its own under the project page's. It hosts the New issue dialog (`new-issue`).
 */
export default function ProjectKnowledgeTab(): ReactElement {
  const { project } = useProjectPage();
  const labels = useKnowledgeLabels();
  const refreshInbox = useRefreshInbox();
  const space = projectSpace(project.id);
  const accessDetails = useKnowledgeAccessDetails(space);
  return (
    <>
      <KnowledgeView
        space={space}
        accessDetails={accessDetails}
        labels={labels}
        title={false}
        className='h-[calc(100svh-16rem)] min-h-96'
        onProposalDecided={refreshInbox}
      />
      <Outlet />
    </>
  );
}
