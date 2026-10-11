/**
 * Hands the New issue dialog's requirements to a conversation and closes the dialog only after a runnable handoff.
 * Failures stay beside the action with the input intact. Closing the dialog aborts the browser request and prevents
 * a late response from opening the panel or navigating away from the page the person has moved to.
 */
import { useChatPanel } from '@nocobase/app-plugin-agents/client/chat';
import type { SendMessageResult } from '@nocobase/app-plugin-agents/shared/conversations';
import {
  usePlanApi,
  type IntakeAgentSlotProps,
} from '@nocobase/app-plugin-projects/client/kit';
import { ApiClientError, useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { AlertCircleIcon, BotMessageSquareIcon } from 'lucide-react';
import { useEffect, useRef, useState, type ReactElement } from 'react';
import { useLocation, useNavigate } from 'react-router';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

import {
  INTAKE_ROUTE,
  intakeUnavailableReason,
  type OrganizeRequest,
} from '../../shared/intake.js';
import { fitIntake, intakeTitleText } from './intake-text.js';

const TITLE_CHARS = 30;

/** "Let an agent organize" on the AI draft tab. */
export function Organize({
  text,
  fileIds,
  projectId,
  disabled,
  className,
}: IntakeAgentSlotProps): ReactElement | null {
  const { t } = useTranslation();
  const api = useApiClient();
  const plans = usePlanApi();
  const panel = useChatPanel();
  const navigate = useNavigate();
  const location = useLocation();
  const startingRef = useRef(false);
  const requestRef = useRef<AbortController | null>(null);
  const [starting, setStarting] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  useEffect(() => () => requestRef.current?.abort(), []);

  function failureText(reason: string): string {
    switch (reason) {
      case 'INTAKE_NO_AGENT':
      case 'noChatAgent':
        return t('pmChat.intake.noAgent');
      case 'INTAKE_MODEL_MISSING':
        return t('pmChat.intake.modelMissing');
      case 'INTAKE_MODEL_UNAVAILABLE':
        return t('pmChat.intake.modelUnavailable');
      case 'INTAKE_NO_RUNNER':
        return t('pmChat.intake.noRunner');
      case 'INTAKE_AGENT_UNAVAILABLE':
        return t('pmChat.intake.agentUnavailable');
      case 'INTAKE_TOO_LONG':
        return t('pmChat.intake.tooLong');
      case 'UNAUTHENTICATED':
        return t('pmChat.intake.sessionEnded');
      case 'FORBIDDEN':
        return t('pmChat.intake.forbidden');
      case 'RUN_NOT_STARTED':
        return t('pmChat.intake.runNotStarted');
      default:
        return t('pmChat.intake.requestFailed');
    }
  }

  async function start(): Promise<void> {
    if (startingRef.current) return;
    startingRef.current = true;
    const controller = new AbortController();
    requestRef.current = controller;
    setStarting(true);
    setFailure(null);
    try {
      const read = fileIds.length > 0 ? await plans.intakeTexts(fileIds) : null;
      if (controller.signal.aborted) return;
      const fitted = fitIntake(
        text.trim() || t('pmChat.intake.filesOnly'),
        (read?.documents ?? []).map((document) => ({
          name: document.filename,
          text: document.text,
        })),
      );
      const request: OrganizeRequest = {
        text: fitted.text,
        title: t('pmChat.intake.conversationTitle', {
          text:
            intakeTitleText(text, TITLE_CHARS) ||
            (read?.documents[0]?.filename ?? ''),
        }),
        ...(projectId ? { projectId } : {}),
        ...(fitted.files.length > 0 ? { files: fitted.files } : {}),
      };
      const { data: result } = await api.request<{ data: SendMessageResult }>({
        path: INTAKE_ROUTE,
        method: 'POST',
        json: request,
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      const unavailable = intakeUnavailableReason({
        models: result.conversation.models,
        availability: result.conversation.availability,
      });
      if (unavailable) {
        setFailure(unavailable);
        return;
      }
      if (
        !result.run ||
        result.conversation.run?.status === 'failed' ||
        result.conversation.run?.status === 'cancelled'
      ) {
        setFailure('RUN_NOT_STARTED');
        return;
      }
      panel.openChat({ conversationId: result.conversation.id, view: 'chat' });
      // The projects plugin owns the overlay; its slot does not export a close handle.
      await navigate(
        { pathname: '..', search: location.search, hash: '' },
        { relative: 'route', replace: true },
      );
    } catch (error) {
      if (controller.signal.aborted) return;
      setFailure(
        error instanceof ApiClientError
          ? error.status === 401
            ? 'UNAUTHENTICATED'
            : error.status === 403
              ? 'FORBIDDEN'
              : (error.reason ?? 'REQUEST_FAILED')
          : 'REQUEST_FAILED',
      );
    } finally {
      startingRef.current = false;
      if (!controller.signal.aborted) setStarting(false);
    }
  }

  const canRetry = failure !== 'FORBIDDEN' && failure !== 'UNAUTHENTICATED';
  return (
    <div className='flex w-full flex-col gap-2'>
      {failure || !panel.available ? (
        <Alert variant='destructive'>
          <AlertCircleIcon />
          <AlertTitle>{t('pmChat.intake.startFailed')}</AlertTitle>
          <AlertDescription>
            {panel.available
              ? failureText(failure!)
              : t('pmChat.intake.chatUnavailable')}
          </AlertDescription>
        </Alert>
      ) : null}
      <Button
        type='button'
        variant='outline'
        className={className}
        disabled={disabled || starting || !panel.available || !canRetry}
        data-testid='intake-agent'
        onClick={() => void start()}
      >
        {starting ? (
          <Spinner data-icon='inline-start' />
        ) : (
          <BotMessageSquareIcon data-icon='inline-start' />
        )}
        {t(
          failure && canRetry
            ? 'pmChat.intake.retry'
            : 'pmChat.intake.organize',
        )}
      </Button>
    </div>
  );
}
