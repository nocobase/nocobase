import { cn } from 'cn';
import { useRef, useState, type ReactElement } from 'react';
import { Link } from 'react-router';

import type { SessionLink } from '../../shared/api.js';
import { useLinkOpen } from '../config.js';
import { plainClick } from '../lib/clicks.js';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip.js';

/**
 * A linked record's identifier, quiet, before its title: a plain click opens it in its panel beside the conversation when
 * the application gives its kind one, else where its application shows it.
 */
export function LinkName({
  link,
  title = false,
  className,
}: {
  readonly link: SessionLink;
  /** The title alone, where the key is shown elsewhere (the details' task list); one line, the whole of it on hover. */
  readonly title?: boolean;
  readonly className?: string;
}): ReactElement {
  const titleRef = useRef<HTMLSpanElement>(null);
  const openLink = useLinkOpen();
  const [open, setOpen] = useState(false);
  const isTruncated = (): boolean => {
    const element = titleRef.current;
    return Boolean(
      element &&
      (element.scrollWidth > element.clientWidth ||
        element.scrollHeight > element.clientHeight),
    );
  };

  const name = (
    <>
      {link.key && !title && (
        <span className='text-muted-foreground mr-1.5 shrink-0 font-mono text-xs font-normal'>
          {link.key}
        </span>
      )}
      <span
        ref={titleRef}
        className={cn(
          'min-w-0 flex-1 group-hover/link-name:underline',
          'truncate',
        )}
      >
        {link.title}
      </span>
    </>
  );
  const classes = cn('flex min-w-0 flex-1 text-sm', className);
  const content = link.href ? (
    <Link
      to={link.href}
      // Only the title underlines: the key beside it is set smaller, so one line under both would not meet.
      className={cn(classes, 'group/link-name items-baseline')}
      onClick={(event) => {
        event.stopPropagation();
        if (plainClick(event) && openLink?.(link)) event.preventDefault();
      }}
    >
      {name}
    </Link>
  ) : (
    <span className={classes}>{name}</span>
  );
  return (
    <Tooltip
      open={open}
      onOpenChange={(nextOpen) => setOpen(nextOpen && isTruncated())}
    >
      <TooltipTrigger render={content} />
      <TooltipContent className='max-h-[calc(100dvh-2rem)] max-w-[min(20rem,calc(100vw-2rem))] overflow-y-auto whitespace-normal [overflow-wrap:anywhere]'>
        {link.title}
      </TooltipContent>
    </Tooltip>
  );
}
