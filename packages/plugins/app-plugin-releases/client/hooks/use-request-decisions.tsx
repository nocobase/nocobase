/**
 * Approving or rejecting a deployment request from its dialog (`pages/request-page.tsx`), with the approver's comment
 * as the decision note the requester is told. Approving on a protected environment asks for the App ID typed again, as
 * a direct deployment there does. A failure stays in the dialog (`error`). The server checks the approver again.
 */
import { ApiClientError } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useState, type ReactElement } from 'react';

import { ACCESS_NAMESPACE } from '../../shared/access.js';
import type { DeploymentRequestView } from '../../shared/releases.js';
import { useConfirmDialog } from '../components/confirm-dialog.js';
import { useNotify } from './use-notify.js';
import { useReleasesApi } from './use-releases.js';

export type RequestDecision = 'approve' | 'reject';

export interface RequestDecisions {
  /** Decides the request with an optional comment; true once decided, false when given up or failed. */
  readonly decide: (
    request: DeploymentRequestView,
    decision: RequestDecision,
    comment?: string,
  ) => Promise<boolean>;
  /** The decision running, if any. */
  readonly busy: RequestDecision | null;
  /** Why the last decision failed, until the next one. */
  readonly error: unknown;
  /** The App ID confirmation; render it once inside the dialog. */
  readonly dialog: ReactElement;
}

export function useRequestDecisions(
  onDecided: (request: DeploymentRequestView) => void,
): RequestDecisions {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const api = useReleasesApi();
  const notify = useNotify();
  const confirmDialog = useConfirmDialog();
  const [busy, setBusy] = useState<RequestDecision | null>(null);
  const [error, setError] = useState<unknown>(null);

  const confirmProtected = (
    request: DeploymentRequestView,
  ): Promise<string | null> =>
    confirmDialog.ask({
      title: t('ui.requests.confirmApproveTitle', { appId: request.appId }),
      description: t('ui.deploy.confirmProtected', { appId: request.appId }),
      action: t('ui.requests.approve'),
      typeToConfirm: request.appId,
    });

  const decide = async (
    request: DeploymentRequestView,
    decision: RequestDecision,
    comment?: string,
  ): Promise<boolean> => {
    const note = comment?.trim() ? { note: comment.trim() } : {};
    let body: { confirm?: string; note?: string } = note;
    if (decision === 'approve' && request.environment?.protected) {
      const confirm = await confirmProtected(request);
      if (confirm === null) return false;
      body = { ...note, confirm };
    }
    setError(null);
    setBusy(decision);
    const path = `deploymentRequests/${encodeURIComponent(request.id)}/${decision}`;
    try {
      try {
        await api.send('POST', path, body);
      } catch (reason) {
        // The environment became protected since the request was read: ask now, as the server does.
        if (
          decision !== 'approve' ||
          !(reason instanceof ApiClientError) ||
          reason.reason !== 'CONFIRMATION_REQUIRED'
        )
          throw reason;
        const confirm = await confirmProtected(request);
        if (confirm === null) return false;
        await api.send('POST', path, { ...note, confirm });
      }
      notify.success(
        t(
          decision === 'approve'
            ? 'ui.requests.approvedToast'
            : 'ui.requests.rejectedToast',
          { appId: request.appId },
        ),
      );
      onDecided(request);
      return true;
    } catch (reason) {
      setError(reason);
      return false;
    } finally {
      setBusy(null);
    }
  };

  return { decide, busy, error, dialog: confirmDialog.dialog };
}
