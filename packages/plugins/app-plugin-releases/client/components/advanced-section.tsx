/** Optional settings folded under "Advanced (optional)" in a dialog, open once someone asks for them. */
import { useTranslation } from '@nocobase/i18n/client';
import { ChevronRightIcon } from 'lucide-react';
import { useState, type ReactElement, type ReactNode } from 'react';

import { ACCESS_NAMESPACE } from '../../shared/access.js';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible.js';

export function AdvancedSection({
  children,
  defaultOpen = false,
  summary,
}: {
  readonly children: ReactNode;
  readonly defaultOpen?: boolean;
  /** What is set inside, shown next to the title while it is folded. */
  readonly summary?: string | null;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className='flex flex-col gap-4'
    >
      <CollapsibleTrigger className='group/advanced flex w-fit items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground'>
        <ChevronRightIcon
          className='size-4 transition-transform group-data-[panel-open]/advanced:rotate-90'
          aria-hidden='true'
        />
        {t('ui.advanced')}
        {!open && summary ? (
          <span className='font-normal'>· {summary}</span>
        ) : null}
      </CollapsibleTrigger>
      <CollapsibleContent className='flex flex-col gap-5'>
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
