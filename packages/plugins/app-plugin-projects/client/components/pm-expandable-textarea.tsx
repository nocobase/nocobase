import { useTranslation } from '@nocobase/i18n/client';
import { Maximize2Icon, Minimize2Icon } from 'lucide-react';
import { useState, type ComponentProps, type ReactElement } from 'react';

import { cn } from 'cn';
import { Button } from './ui/button.js';
import { Textarea } from './ui/textarea.js';

/**
 * A text area for long text in a compact form, such as a status rule's instruction: it grows with its text up to a few
 * lines and scrolls beyond them, until the corner button expands it to most of the screen's height.
 */
export function PmExpandableTextarea({
  className,
  ...props
}: ComponentProps<'textarea'>): ReactElement {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const label = t(expanded ? 'common.collapseText' : 'common.expandText');
  return (
    <div className='relative' data-expanded={expanded || undefined}>
      <Textarea
        {...props}
        className={cn(
          'pr-9',
          expanded ? 'min-h-48 max-h-[60dvh]' : 'max-h-32',
          className,
        )}
      />
      <Button
        type='button'
        variant='ghost'
        size='icon-xs'
        className='absolute top-1.5 right-1.5 text-muted-foreground'
        aria-label={label}
        title={label}
        aria-expanded={expanded}
        onClick={() => setExpanded((value) => !value)}
      >
        {expanded ? <Minimize2Icon /> : <Maximize2Icon />}
      </Button>
    </div>
  );
}
