import { cn } from 'cn';
import type { ReactElement } from 'react';
import { Link } from 'react-router';

import type { SessionLink } from '../../shared/api.js';

/** A linked record's identifier, quiet, before its title, opening where its application shows it. */
export function LinkName({
  link,
  className,
}: {
  readonly link: SessionLink;
  readonly className?: string;
}): ReactElement {
  const name = (
    <>
      {link.key && (
        <span className='text-muted-foreground mr-1.5 font-mono text-[11px] font-normal'>
          {link.key}
        </span>
      )}
      {link.title}
    </>
  );
  const classes = cn('min-w-0 flex-1 truncate text-[13px]', className);
  return link.href ? (
    <Link
      to={link.href}
      className={cn(classes, 'hover:underline')}
      onClick={(event) => event.stopPropagation()}
    >
      {name}
    </Link>
  ) : (
    <span className={classes}>{name}</span>
  );
}
