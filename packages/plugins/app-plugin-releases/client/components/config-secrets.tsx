/**
 * The secrets an App's `config.yml` holds, write-only like an environment's credentials: each reads "Set" with Replace
 * and Clear, and its value is never shown. The server masks them in the configuration text (`CONFIG_SECRET_MASK`); a
 * replacement or a removal is sent beside the text as a `ConfigSecretChange`.
 */
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';

import { ACCESS_NAMESPACE } from '../../shared/access.js';
import { formatConfigPath, type ConfigSecret } from '../../shared/releases.js';
import {
  configPathKey,
  type ConfigSecretDraft,
  type ConfigSecretDrafts,
} from '../lib/config-secrets.js';
import { Badge } from './ui/badge.js';
import { Button } from './ui/button.js';
import { Input } from './ui/input.js';

export function ConfigSecrets({
  secrets,
  drafts,
  disabled,
  onChange,
}: {
  readonly secrets: readonly ConfigSecret[];
  readonly drafts: ConfigSecretDrafts;
  readonly disabled?: boolean;
  readonly onChange: (drafts: ConfigSecretDrafts) => void;
}): ReactElement | null {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  if (secrets.length === 0) return null;
  const set = (key: string, draft: ConfigSecretDraft | null): void => {
    const next = { ...drafts };
    if (draft) next[key] = draft;
    else delete next[key];
    onChange(next);
  };
  return (
    <div className='space-y-2' data-slot='config-secrets'>
      <div>
        <p className='text-sm font-medium'>{t('ui.config.secrets')}</p>
        <p className='text-sm text-muted-foreground'>
          {t('ui.config.secretsHint')}
        </p>
      </div>
      <ul className='divide-y rounded-lg border bg-card'>
        {secrets.map((secret) => {
          const key = configPathKey(secret.path);
          const label = formatConfigPath(secret.path);
          const draft = drafts[key];
          const inputId = `rel-config-secret-${encodeURIComponent(key)}`;
          return (
            <li
              key={key}
              className='flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between'
            >
              <label
                htmlFor={draft?.mode === 'replace' ? inputId : undefined}
                className='min-w-0 truncate font-mono text-xs'
              >
                {label}
              </label>
              {draft?.mode === 'replace' ? (
                <div className='flex flex-wrap items-center gap-2'>
                  <Input
                    id={inputId}
                    type='password'
                    autoComplete='new-password'
                    autoFocus
                    className='h-8 w-full sm:w-64'
                    aria-label={t('ui.config.newValue', { path: label })}
                    value={draft.value}
                    disabled={disabled}
                    onChange={(event) =>
                      set(key, { mode: 'replace', value: event.target.value })
                    }
                  />
                  <Button
                    type='button'
                    size='sm'
                    variant='ghost'
                    disabled={disabled}
                    onClick={() => set(key, null)}
                  >
                    {t('ui.driverForm.keepStored')}
                  </Button>
                </div>
              ) : draft?.mode === 'clear' ? (
                <div className='flex flex-wrap items-center gap-2'>
                  <Badge variant='destructive'>
                    {t('ui.driverForm.secretCleared')}
                  </Badge>
                  <Button
                    type='button'
                    size='sm'
                    variant='ghost'
                    disabled={disabled}
                    onClick={() => set(key, null)}
                  >
                    {t('ui.driverForm.undo')}
                  </Button>
                </div>
              ) : (
                <div className='flex flex-wrap items-center gap-2'>
                  <Badge variant='secondary'>
                    {t('ui.driverForm.secretSet')}
                  </Badge>
                  <Button
                    type='button'
                    size='sm'
                    variant='outline'
                    disabled={disabled}
                    aria-label={t('ui.config.replace', { path: label })}
                    onClick={() => set(key, { mode: 'replace', value: '' })}
                  >
                    {t('ui.driverForm.replace')}
                  </Button>
                  <Button
                    type='button'
                    size='sm'
                    variant='ghost'
                    disabled={disabled}
                    aria-label={t('ui.config.clear', { path: label })}
                    onClick={() => set(key, { mode: 'clear', value: '' })}
                  >
                    {t('ui.driverForm.clear')}
                  </Button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
