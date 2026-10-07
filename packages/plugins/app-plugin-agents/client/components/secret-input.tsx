/**
 * A write-only secret field (an API key, a password): a password input that never shows the saved value. When one is
 * set (`isSet`), the empty field says so and that leaving it empty keeps it; whatever is typed replaces it on save.
 */
import { useTranslation } from '@nocobase/i18n/client';
import type { ComponentProps, ReactElement } from 'react';

import { Input } from './ui/input.js';

export function SecretInput({
  isSet,
  placeholder,
  ...props
}: Omit<ComponentProps<typeof Input>, 'type'> & {
  /** Whether a value is saved already. */
  readonly isSet: boolean;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <Input
      type='password'
      autoComplete='new-password'
      placeholder={isSet ? t('common.secretKept') : placeholder}
      {...props}
    />
  );
}
