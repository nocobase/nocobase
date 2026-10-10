/**
 * Route `/issues/:issueId/runs/:runId`: a run's transcript in a dialog over the issue page, so a notification or the
 * inbox can link to one run.
 */
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';
import { useParams } from 'react-router';

import { RouteDialog } from '@/components/route-dialog';

import { IssueRunTranscript } from '../../../agents/issue-runs.js';
import { IssueMarkdown } from '../../../issues/markdown.js';

export default function RunDialogPage(): ReactElement {
  const { t } = useTranslation();
  const { runId = '' } = useParams();
  return (
    <RouteDialog
      title={t('issuesPage.detail.runTranscript')}
      className='sm:max-w-4xl'
    >
      <IssueRunTranscript
        key={runId}
        runId={runId}
        renderMarkdown={(text) => <IssueMarkdown content={text} />}
      />
    </RouteDialog>
  );
}
