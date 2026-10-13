import { cn } from 'cn';
import { useRef, useState, type ReactElement } from 'react';
import { Link } from 'react-router';

import type { SessionLink } from '../../shared/api.js';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip.js';

/** A linked record's identifier, quiet, before its title, opening where its application shows it. */
export function LinkName({
  link,
  className,
}: {
  readonly link: SessionLink;
  readonly className?: string;
}): ReactElement {
  const titleRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const isTruncated = (): boolean => {
    const element = titleRef.current;
    return Boolean(element && element.scrollWidth > element.clientWidth);
  };

  const name = (
    <>
      {link.key && (
        <span className='text-muted-foreground mr-1.5 shrink-0 font-mono text-[11px] font-normal'>
          {link.key}
        </span>
      )}
      <span ref={titleRef} className='min-w-0 flex-1 truncate'>
        {link.title}
      </span>
    </>
  );
  const classes = cn('flex min-w-0 flex-1 text-[13px]', className);
  const content = link.href ? (
    <Link
      to={link.href}
      className={cn(classes, 'hover:underline')}
      onClick={(event) => event.stopPropagation()}
      onPointerEnter={() => setOpen(isTruncated())}
      onPointerLeave={() => setOpen(false)}
      onFocus={() => setOpen(isTruncated())}
      onBlur={() => setOpen(false)}
    >
      {name}
    </Link>
  ) : (
    <span
      className={classes}
      onPointerEnter={() => setOpen(isTruncated())}
      onPointerLeave={() => setOpen(false)}
      onFocus={() => setOpen(isTruncated())}
      onBlur={() => setOpen(false)}
    >
      {name}
    </span>
  );
  return (
    <Tooltip
      open={open}
      onOpenChange={(nextOpen) => setOpen(nextOpen && isTruncated())}
    >
      <TooltipTrigger render={content} />
      <TooltipContent className='max-h-[calc(100dvh-1rem)] max-w-[min(20rem,calc(100vw-2rem))] overflow-y-auto whitespace-normal [overflow-wrap:anywhere]'>
        {link.title}
      </TooltipContent>
    </Tooltip>
  );
}
