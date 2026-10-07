/**
 * A table row's actions behind one "…" button, as shadcn's Data Table does. Destructive items go last, after a
 * `DropdownMenuSeparator`, with `variant='destructive'`. While one of the row's actions runs, the button spins.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { MoreHorizontalIcon } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';

import { ACCESS_NAMESPACE } from '../../shared/access.js';
import { Button } from './ui/button.js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from './ui/dropdown-menu.js';
import { Spinner } from './ui/spinner.js';

export function RowActions({
  name,
  busy,
  disabled,
  children,
}: {
  /** What the row is called, for the button's accessible name. */
  readonly name: string;
  readonly busy?: boolean;
  readonly disabled?: boolean;
  readonly children: ReactNode;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  return (
    <div className='flex justify-end'>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant='ghost'
              size='icon-sm'
              disabled={disabled}
              aria-label={t('ui.common.rowActions', { name })}
            />
          }
        >
          {busy ? <Spinner /> : <MoreHorizontalIcon />}
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-auto min-w-40'>
          {children}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
