import { useTranslation } from '@nocobase/i18n/client';
import { PlayIcon, RotateCwIcon, SquareIcon } from 'lucide-react';
import { useId, type ReactElement, type ReactNode } from 'react';

import { ACCESS_NAMESPACE } from '../../shared/access.js';
import type { AppSummary } from '../../shared/releases.js';
import {
  operationDisabledReason,
  type AppOperation,
} from '../lib/app-operations.js';
import { Button } from './ui/button.js';
import { Spinner } from './ui/spinner.js';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip.js';

const ICONS: Readonly<Record<AppOperation, ReactNode>> = {
  start: <PlayIcon data-icon='inline-start' />,
  stop: <SquareIcon data-icon='inline-start' />,
  restart: <RotateCwIcon data-icon='inline-start' />,
};

export function AppOperations({
  summary,
  busy,
  stale,
  onRun,
}: {
  readonly summary: AppSummary;
  readonly busy: string | null;
  readonly stale: boolean;
  readonly onRun: (operation: AppOperation) => void;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const descriptionId = useId();
  return (
    <TooltipProvider>
      {(['start', 'stop', 'restart'] as const).map((operation) => {
        const reason = operationDisabledReason(
          summary,
          operation,
          busy !== null,
          stale,
        );
        return (
          <Tooltip key={operation} disabled={!reason}>
            <TooltipTrigger
              aria-describedby={
                reason ? `${descriptionId}-${operation}` : undefined
              }
              render={
                <Button
                  variant='outline'
                  aria-label={t(`ui.operate.${operation}`)}
                  disabled={!!reason}
                  focusableWhenDisabled
                  className='data-disabled:opacity-50'
                  onClick={() => {
                    if (!reason) onRun(operation);
                  }}
                />
              }
            >
              {busy === operation ? (
                <Spinner data-icon='inline-start' />
              ) : (
                ICONS[operation]
              )}
              {t(`ui.operate.${operation}`)}
            </TooltipTrigger>
            {reason ? (
              <TooltipContent
                id={`${descriptionId}-${operation}`}
                role='tooltip'
              >
                {t(`ui.operate.disabled.${reason}`)}
              </TooltipContent>
            ) : null}
          </Tooltip>
        );
      })}
    </TooltipProvider>
  );
}
