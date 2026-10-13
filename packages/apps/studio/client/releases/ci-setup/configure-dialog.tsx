/**
 * Settings › Deployment › "Configure CI": the run's form (`configure-form.tsx`) in a dialog with a fixed header and
 * footer and a scrolling body, open while the settings' URL says `configure=1`, so a link or a refresh opens it again.
 * It is `sm:max-w-4xl`, I1's size for large content: beside its fields it shows the generated workflow, commands or
 * prompt to read and copy, and the methods sit side by side. Its primary button says what the way does; a way Studio
 * carries out is sent (`POST …/ci/configure`) and its outcome told in a toast, a refusal or a failed run staying in
 * the dialog in the reader's language (I3, `failure.tsx`); a way done by hand only closes it.
 */
import type { ProjectResource } from '@nocobase/app-plugin-projects/shared/projects';
import { useTranslation } from '@nocobase/i18n/client';
import { Loader2Icon } from 'lucide-react';
import { useState, type ReactElement } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import type {
  CiConnectionView,
  CiRunRequest,
} from '../../../shared/ci-modes.js';
import { errorText, useNotify } from '../../access/notify.js';
import { useConfigureCi } from './api.js';
import { CiConfigureFields } from './configure-form.js';
import { useCiDraft } from './draft.js';
import { CiFailureAlert } from './failure.js';

/** The repository's name, from `owner/name` or its clone URL. */
function repoNameOf(view: CiConnectionView, resource: ProjectResource) {
  return (
    view.repo?.split('/').pop() ??
    resource.url
      ?.replace(/\/+$/u, '')
      .split(/[/:]/u)
      .pop()
      ?.replace(/\.git$/u, '') ??
    null
  );
}

export function ConfigureCiDialog({
  open,
  onOpenChange,
  view,
  resource,
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly view: CiConnectionView;
  readonly resource: ProjectResource;
}): ReactElement {
  const { t } = useTranslation();
  const configure = useConfigureCi(resource.id);
  const saving = configure.isPending;
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!saving) onOpenChange(next);
      }}
    >
      <DialogContent
        className='flex max-h-[calc(100dvh-2rem)] flex-col sm:max-w-4xl'
        data-ci-configure-dialog
      >
        <DialogHeader>
          <DialogTitle>{t('ciSetup.configure.title')}</DialogTitle>
          <DialogDescription>
            {t('ciSetup.configure.description')}
          </DialogDescription>
        </DialogHeader>
        {open ? (
          <ConfigureBody
            view={view}
            resource={resource}
            saving={saving}
            onClose={() => onOpenChange(false)}
            onRun={(run) => configure.mutateAsync(run)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function ConfigureBody({
  view,
  resource,
  saving,
  onClose,
  onRun,
}: {
  readonly view: CiConnectionView;
  readonly resource: ProjectResource;
  readonly saving: boolean;
  readonly onClose: () => void;
  readonly onRun: (run: CiRunRequest) => Promise<CiConnectionView>;
}): ReactElement {
  const { t } = useTranslation();
  const notify = useNotify();
  const defaultBranch = resource.defaultRef ?? 'main';
  const draft = useCiDraft({
    repoName: repoNameOf(view, resource),
    connected: view.connected,
    defaultBranch,
  });
  const [tried, setTried] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failed, setFailed] = useState<CiConnectionView | null>(null);

  async function submit(): Promise<void> {
    setTried(true);
    if (!draft.valid) return;
    const run = draft.request();
    if (!run) {
      onClose();
      return;
    }
    setError(null);
    setFailed(null);
    try {
      const next = await onRun(run);
      if (next.lastError) {
        setFailed(next);
        return;
      }
      notify.success(
        next.state === 'pr-open' && next.pullRequest
          ? t('ciSetup.configure.done.prOpen', {
              number: next.pullRequest.number,
            })
          : next.state === 'pending'
            ? t('ciSetup.configure.done.pending')
            : run.method === 'agent' && next.task
              ? t('ciSetup.configure.done.task', {
                  identifier: next.task.identifier ?? next.task.issueId,
                })
              : t('ciSetup.configure.done.configured'),
      );
      onClose();
    } catch (failure) {
      setError(errorText(t, failure, t('common.requestFailed')));
    }
  }

  return (
    <>
      <div className='-mx-4 min-h-0 flex-1 overflow-y-auto px-4 py-1'>
        {failed?.lastError ? (
          <CiFailureAlert
            className='mb-4'
            message={failed.lastError}
            failure={failed.lastFailure}
            data-ci-configure-error
          />
        ) : error ? (
          <Alert variant='destructive' className='mb-4' data-ci-configure-error>
            <AlertDescription className='break-words'>{error}</AlertDescription>
          </Alert>
        ) : null}
        <CiConfigureFields
          draft={draft}
          repoName={repoNameOf(view, resource)}
          repo={view.repo ?? resource.url ?? null}
          defaultBranch={defaultBranch}
          connected={view.connected}
          secretName={view.secretName}
          showErrors={tried}
          keyTarget={{
            resourceId: resource.id,
            canManage: view.canManage,
            hasKey: view.key !== null && view.key.status !== 'missing',
          }}
        />
      </div>
      <DialogFooter>
        <Button
          type='button'
          variant='outline'
          disabled={saving}
          onClick={onClose}
        >
          {t('ciSetup.cancel')}
        </Button>
        <Button
          type='button'
          disabled={saving}
          onClick={() => void submit()}
          data-ci-configure-submit={draft.method}
        >
          {saving ? (
            <Loader2Icon data-icon='inline-start' className='animate-spin' />
          ) : null}
          {t(`ciSetup.configure.submit.${draft.method}`)}
        </Button>
      </DialogFooter>
    </>
  );
}
