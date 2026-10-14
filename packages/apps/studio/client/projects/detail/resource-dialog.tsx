/**
 * "Add working directory" in a project's Settings › Working directories, Studio's own dialog, behind the "Discard unsaved
 * changes?" question: the New project wizard's choice of a working directory (`projects/code-location`, without
 * "none") — a new repository created when Add is pressed and never before, an existing one picked through a connection
 * or given by its clone URL, or a directory on a runner — with an optional prompt that an "Initialize" issue of its own
 * carries out. One request adds it (`POST /api/projects/:projectId/codeLocations`), then `onAdded` opens a repository's
 * "Deployment", where its preview CI is connected (`releases/ci-setup`) — except for a new NocoBase application, whose
 * preview CI Studio connects with it.
 */
import {
  useApiClient,
  useGuardedClose,
  useUnsavedChanges,
  useUnsavedChangesGuard,
} from '@nocobase/app-client';
import { UnsavedChangesBoundary } from '@nocobase/app-plugin-projects/client/kit';
import { useTranslation } from '@nocobase/i18n/client';
import { useQueryClient } from '@tanstack/react-query';
import { useState, type ReactElement } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FieldGroup } from '@/components/ui/field';

import type { AddCodeLocationRequest } from '../../../shared/project-init.js';
import { errorText, useNotify } from '../../access/notify.js';
import { CodeLocationFields } from '../code-location/code-location-fields.js';
import { NewProjectFormFooter } from '../code-location/parts/new-project-form.js';
import { useCodeLocation } from '../code-location/use-code-location.js';
import { ProjectInitApi } from '../init-api.js';
import { useNewProjectFormLabels } from '../new-project-labels.js';

export interface AddWorkingDirectoryDialogProps {
  /** The project a new working directory is added to. */
  readonly projectId: string;
  readonly open: boolean;
  readonly onClose: () => void;
  /** Called with the new working directory's id once it is added, and whether it is a repository. */
  readonly onAdded: (resourceId: string | null, repository: boolean) => void;
}

export function AddWorkingDirectoryDialog({
  projectId,
  open,
  onClose,
  onAdded,
}: AddWorkingDirectoryDialogProps): ReactElement {
  const { t } = useTranslation();
  const guard = useUnsavedChangesGuard();
  const guardedClose = useGuardedClose(guard, onClose);
  const [saving, setSaving] = useState(false);
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !saving) guardedClose();
      }}
    >
      <DialogContent className='flex max-h-[calc(100dvh-2rem)] flex-col sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>{t('projectPage.codeLocation.addTitle')}</DialogTitle>
          <DialogDescription>
            {t('projectPage.codeLocation.addDescription')}
          </DialogDescription>
        </DialogHeader>
        {open ? (
          <UnsavedChangesBoundary guard={guard}>
            <AddCodeLocationForm
              projectId={projectId}
              onAdded={onAdded}
              onCancel={guardedClose}
              onSavingChange={setSaving}
            />
          </UnsavedChangesBoundary>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

/** A working directory added to the project, with what comes with it, in one request. */
function AddCodeLocationForm({
  projectId,
  onAdded,
  onCancel,
  onSavingChange,
}: {
  readonly projectId: string;
  readonly onAdded: (resourceId: string | null, repository: boolean) => void;
  readonly onCancel: () => void;
  readonly onSavingChange: (saving: boolean) => void;
}): ReactElement {
  const { t } = useTranslation();
  const labels = useNewProjectFormLabels();
  const code = useCodeLocation('project');
  const api = new ProjectInitApi(useApiClient());
  const notify = useNotify();
  const queryClient = useQueryClient();
  const [start] = useState(() => JSON.stringify(code.request()));
  const markSaved = useUnsavedChanges(JSON.stringify(code.request()) !== start);

  const request = (): AddCodeLocationRequest => {
    const location = code.request();
    return {
      ...location,
      codeLocation:
        location.codeLocation === 'none'
          ? 'existingRepo'
          : location.codeLocation,
    };
  };

  return (
    <>
      <div className='-mx-4 min-h-0 flex-1 overflow-y-auto px-4 py-1'>
        <FieldGroup>
          <CodeLocationFields state={code} labels={labels} />
          {code.repository ? (
            <p className='text-sm text-muted-foreground'>
              {code.nocobaseInit
                ? t('projectPage.codeLocation.ciWithApp')
                : t('projectPage.codeLocation.ciLater')}
            </p>
          ) : null}
        </FieldGroup>
      </div>
      <DialogFooter>
        <NewProjectFormFooter
          canSubmit={code.missing === null}
          missing={code.missing}
          labels={labels}
          submitLabel={t('projectPage.codeLocation.add')}
          onCancel={onCancel}
          onSubmit={async () => {
            onSavingChange(true);
            try {
              const result = await api.addCodeLocation(projectId, request());
              notify.success(
                result.initIssueIdentifier
                  ? t('projectPage.codeLocation.addedWithIssue', {
                      identifier: result.initIssueIdentifier,
                    })
                  : t('projectPage.codeLocation.added'),
              );
              void queryClient.invalidateQueries({ queryKey: ['pm'] });
              void queryClient.invalidateQueries({
                queryKey: ['studio', 'releases'],
              });
              onSavingChange(false);
              markSaved();
              // A NocoBase application's preview CI was connected with it: nothing to open.
              onAdded(result.resourceId, code.repository && !code.nocobaseInit);
            } catch (error) {
              onSavingChange(false);
              notify.error(
                error,
                errorText(t, error, t('common.requestFailed')),
              );
            }
          }}
        />
      </DialogFooter>
    </>
  );
}
