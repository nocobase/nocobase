import { KnowledgeView } from '@nocobase/app-plugin-knowledge/client/pages';
import type { ReactElement } from 'react';

import { SYSTEM_SPACE } from '../../../shared/knowledge.js';
import { useRefreshInbox } from '../../knowledge/inbox-refresh.js';
import { useKnowledgeAccessDetails } from '../../knowledge/access.js';
import { useKnowledgeLabels } from '../../knowledge/labels.js';
import { KnowledgeSpaceSwitcher } from '../../knowledge/space-switcher.js';

/**
 * Route `/knowledge`: the system's knowledge, which every project inherits (conventions, the user manual), behind the
 * knowledge plugin's `knowledge` page grant (administrators and owners), in the plugin's view filling the page. Its
 * heading switches to a project's knowledge, which is that project's Knowledge tab.
 */
export default function KnowledgePage(): ReactElement {
  const labels = useKnowledgeLabels();
  const refreshInbox = useRefreshInbox();
  const accessDetails = useKnowledgeAccessDetails(SYSTEM_SPACE);
  return (
    <section className='flex h-full min-h-96 flex-col p-4 md:p-6'>
      <KnowledgeView
        space={SYSTEM_SPACE}
        labels={labels}
        title={<KnowledgeSpaceSwitcher />}
        accessDetails={accessDetails}
        className='min-h-0 flex-1'
        onProposalDecided={refreshInbox}
      />
    </section>
  );
}
