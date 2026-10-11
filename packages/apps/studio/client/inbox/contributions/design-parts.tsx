/** The parts of a design proposal's inbox card (`design.ts`): the proposal, with its decision, above the issue. */
import { useTranslation } from '@nocobase/i18n/client';
import { ArrowDownIcon } from 'lucide-react';
import type { ReactElement } from 'react';

import { Button } from '@/components/ui/button';

import { DESIGN_SECTION_ANCHOR } from '../../../shared/design.js';
import { useDesignState } from '../../agents/design/api.js';
import { DesignProposalView } from '../../agents/design/proposal-view.js';
import type { InboxPartProps } from '@/extensions/nocobase-inbox/registry';
import { ProjectsBody } from './projects-parts.js';
import type { ProjectsModel } from './projects.js';

export function DesignBody(props: InboxPartProps<ProjectsModel>): ReactElement {
  const { entry, model, onDecided } = props;
  const issueId = model.issueId;
  const state = useDesignState(issueId, model.detail.data?.revision);
  return (
    <>
      {issueId ? (
        <DesignProposalView
          issueId={issueId}
          identifier={entry.notice?.subject?.label ?? ''}
          state={state.data}
          loading={state.isPending}
          onDecided={onDecided}
        />
      ) : null}
      <ProjectsBody {...props} />
    </>
  );
}

/** On the issue page: the way to the proposal's own section (`#design`), where it is decided. */
export function DesignHere(): ReactElement {
  const { t } = useTranslation();
  return (
    <Button
      size='sm'
      variant='outline'
      onClick={() =>
        document
          .getElementById(DESIGN_SECTION_ANCHOR)
          ?.scrollIntoView?.({ block: 'start', behavior: 'smooth' })
      }
    >
      <ArrowDownIcon data-icon='inline-start' />
      {t('inbox.here.design')}
    </Button>
  );
}
