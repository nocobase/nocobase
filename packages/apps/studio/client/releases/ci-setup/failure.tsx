/**
 * Why configuring CI, or rotating its key, last failed, in the reader's language: a known reason (`lastFailure`,
 * `shared/ci-modes.ts`) worded by `ciSetup.failures.<reason>` with what it names; anything else, and a failure recorded
 * before reasons were, as one general sentence with the server's own words behind "Details".
 */
import { useTranslation } from '@nocobase/i18n/client';
import { ChevronDownIcon, TriangleAlertIcon } from 'lucide-react';
import type { ReactElement } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

import type { CiFailure } from '../../../shared/ci-modes.js';

/** The sentence a failure is shown as; null when only its raw words say what happened. */
function useCiFailureText(): (failure: CiFailure | null) => string | null {
  const { t } = useTranslation();
  return (failure) => {
    if (!failure || failure.reason === 'unknown') return null;
    const how = failure.params.how;
    return t(`ciSetup.failures.${failure.reason}`, {
      ...failure.params,
      ...(how === 'disabled' || how === 'deleted'
        ? { how: t(`ciSetup.failures.keyRevokedHow.${how}`) }
        : {}),
    });
  };
}

export function CiFailureAlert({
  message,
  failure,
  className,
  ...rest
}: {
  /** The failure's words as the server recorded them, in English. */
  readonly message: string;
  readonly failure: CiFailure | null;
  readonly className?: string;
  readonly 'data-ci-error'?: boolean;
  readonly 'data-ci-configure-error'?: boolean;
}): ReactElement {
  const { t } = useTranslation();
  const textOf = useCiFailureText();
  const known = textOf(failure);
  return (
    <Alert
      variant='destructive'
      className={className}
      data-ci-failure={failure?.reason ?? 'unknown'}
      {...rest}
    >
      <TriangleAlertIcon />
      <AlertTitle>
        {failure?.reason === 'rotationFailed'
          ? t('ciSetup.failures.rotationTitle')
          : t('ciSetup.lastError')}
      </AlertTitle>
      <AlertDescription className='break-words'>
        <p>{known ?? t('ciSetup.failures.unknown')}</p>
        {known && failure?.reason !== 'rotationFailed' ? null : (
          <Collapsible>
            <CollapsibleTrigger className='group/details inline-flex items-center gap-1 text-xs underline-offset-4 hover:underline'>
              {t('ciSetup.failures.details')}
              <ChevronDownIcon
                className='size-3 transition-transform group-data-[panel-open]/details:rotate-180'
                aria-hidden
              />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <p className='mt-1 font-mono text-xs' data-ci-error-detail>
                {message}
              </p>
            </CollapsibleContent>
          </Collapsible>
        )}
      </AlertDescription>
    </Alert>
  );
}
