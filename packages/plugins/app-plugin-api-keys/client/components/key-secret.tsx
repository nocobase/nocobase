import { resolveAppUrl, useClientApplication } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { CheckIcon, CopyIcon, TriangleAlertIcon } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';

import { Alert, AlertDescription } from '#components/ui/alert';
import { Button } from '#components/ui/button';
import { useCopy } from '../lib/use-copy.js';
import { API_KEYS_NAMESPACE } from '../namespace.js';

/** The application's API address, absolute, for an example a person runs in a terminal. */
function useApiBase(): string {
  const app = useClientApplication();
  const base = app.config.get<string>('api.baseURL') ?? resolveAppUrl('/api');
  return new URL(base, window.location.href).toString().replace(/\/+$/u, '');
}

/**
 * A key's secret right after it is made or rotated: shown this once, with a copy button and a request to try it.
 * `details` are rows such as the key's name and expiry.
 */
export function KeySecret({
  secret,
  details,
}: {
  readonly secret: string;
  readonly details?: readonly { label: string; value: ReactNode }[];
}): ReactElement {
  const { t } = useTranslation(API_KEYS_NAMESPACE);
  const { copied, copy } = useCopy();
  const example = `curl -H 'x-api-key: ${secret}' ${useApiBase()}/auth/get-session`;
  return (
    <div className='grid min-w-0 gap-4'>
      <Alert className='border-amber-500/40 bg-amber-500/5 text-amber-900 dark:text-amber-200'>
        <TriangleAlertIcon aria-hidden />
        <AlertDescription className='text-inherit'>
          {t('created.onceOnly')}
        </AlertDescription>
      </Alert>
      <div className='grid min-w-0 gap-1.5'>
        <span className='text-sm font-medium'>{t('created.secret')}</span>
        <div className='flex min-w-0 items-center gap-2 rounded-lg border bg-muted/40 p-2'>
          <code
            data-slot='api-key-secret'
            className='min-w-0 flex-1 font-mono text-sm break-all select-all'
          >
            {secret}
          </code>
          <Button
            type='button'
            size='sm'
            variant='outline'
            onClick={() => void copy(secret)}
          >
            {copied ? <CheckIcon aria-hidden /> : <CopyIcon aria-hidden />}
            {copied ? t('common.copied') : t('common.copy')}
          </Button>
        </div>
      </div>
      {details?.length ? (
        <dl className='grid min-w-0 grid-cols-[max-content_1fr] gap-x-4 gap-y-1.5 text-sm'>
          {details.map((row) => (
            <div key={row.label} className='contents'>
              <dt className='text-muted-foreground'>{row.label}</dt>
              <dd className='min-w-0 break-words'>{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      <div className='grid min-w-0 gap-1.5'>
        <span className='text-sm font-medium'>{t('created.example')}</span>
        <pre className='overflow-x-auto rounded-lg bg-muted px-3 py-2 font-mono text-xs'>
          {example}
        </pre>
      </div>
    </div>
  );
}
