import { useUnsavedChangesGuard } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { type ReactElement, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';

import { RouteDialog } from '../../components/route-dialog.js';
import { UnsavedChangesBoundary } from '../../components/unsaved-changes.js';
import { NewIssueFooter, NewIssueForm } from './new-issue-form.js';

export default function NewIssuePage(): ReactElement {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  // Over a project's page the dialog stays there: created, it closes instead of opening the issue.
  const overProject = useParams().projectId !== undefined;
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [startNow, setStartNow] = useState(true);
  const submittingRef = useRef(false);
  const unsaved = useUnsavedChangesGuard();
  const onSubmittingChange = (value: boolean): void => {
    submittingRef.current = value;
    setSubmitting(value);
  };
  // Back to the list, without this dialog's own parameters.
  const listSearch = (() => {
    const next = new URLSearchParams(location.search);
    next.delete('tab');
    next.delete('draft');
    next.delete('job');
    const search = next.toString();
    return search ? `?${search}` : '';
  })();
  const manual = (
    <UnsavedChangesBoundary guard={unsaved}>
      <NewIssueForm
        onSubmittingChange={onSubmittingChange}
        onUploadingChange={setUploading}
        onStartChange={setStartNow}
        {...(overProject
          ? {
              onCreated: () =>
                void navigate(
                  { pathname: '..', search: listSearch },
                  { replace: true },
                ),
            }
          : {})}
      />
    </UnsavedChangesBoundary>
  );
  return (
    <RouteDialog
      title={t('newIssue.title')}
      className='sm:max-w-xl'
      closeTo={{ pathname: '..', search: listSearch }}
      beforeClose={() => !submittingRef.current && unsaved.confirmDiscard()}
      footer={
        <NewIssueFooter
          submitting={submitting}
          uploading={uploading}
          startNow={startNow}
        />
      }
    >
      {manual}
    </RouteDialog>
  );
}
