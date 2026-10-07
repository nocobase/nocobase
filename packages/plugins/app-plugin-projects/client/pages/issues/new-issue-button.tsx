import { useTranslation } from '@nocobase/i18n/client';
import { PlusIcon } from 'lucide-react';
import type { ReactElement } from 'react';
import { Link, useLocation } from 'react-router';

import { Button } from '../../components/ui/button.js';
import { Kbd } from '../../components/ui/kbd.js';

/**
 * "New issue": opens the `new` dialog, which starts on its AI draft tab. The `new` dialog is a child route of
 * `/issues`: on that page the button keeps the list's query string, so a filtered project is preselected; elsewhere
 * (`absolute`) it opens the dialog over the issue list. The primary button shows the "C" hint: every page that
 * places it also listens for `C` (`PmShortcuts`). Without
 * `issues/create` it does not render, since creating an issue would only be refused; the caller passes that.
 */
export function NewIssueButton({
  variant = 'default',
  canCreate = true,
  absolute = false,
}: {
  readonly variant?: 'default' | 'outline';
  readonly canCreate?: boolean;
  readonly absolute?: boolean;
}): ReactElement | null {
  const { t } = useTranslation();
  const location = useLocation();
  if (!canCreate) return null;
  return (
    <Button
      variant={variant}
      nativeButton={false}
      render={
        <Link
          to={
            absolute
              ? '/issues/new'
              : { pathname: 'new', search: location.search }
          }
        />
      }
    >
      <PlusIcon data-icon='inline-start' />
      {t('issues.new')}
      {variant === 'default' ? (
        <Kbd data-icon='inline-end' aria-hidden='true'>
          C
        </Kbd>
      ) : null}
    </Button>
  );
}
